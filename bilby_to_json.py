"""
Collection of functions required to transform a bilby.core.Result object into a json object to draw a custom corner react plot.
Refer to bilby docs to setup bilby: https://lscsoft.docs.ligo.org/bilby/index.html
"""

from sample import sample_bilby
import numpy as np
import matplotlib.pyplot as plt
from scipy.ndimage import gaussian_filter
import logging

def corner_contour(result, i, j, maxmin=None):
    """
    Most code taken straight off bilby/corner module. Isolating relevant sections to get coordinates
    i,j are indices that span from [0, num_params - 1]
    assert i < j, as i == j would be a histogram

    default smoothing and levels as given in the bilby.result.plot_contour method. Feel free to adjust or make this an extra parameter

    Input:  result (bilby.core.result.posterior[keys].value object)
            i,j (int): key indices
            maxmin (len(2) array): if a maxmin is given, clip the contour to this window

    Output: contour points : list of list of list format ([[level1], [level2], [level3]]). 
                             Each level contains closed contours corresponding to contours at that level.
    """
    quiet = False

    x_space = result[:,i]
    y_space = result[:,j]
    corner_range = [[x_space.min(), x_space.max()], [y_space.min(), y_space.max()]]

    H, X, Y = np.histogram2d(x_space.flatten(), y_space.flatten(), bins=50, range=list(map(np.sort, corner_range)))

    levels=(1 - np.exp(-0.5), 1 - np.exp(-2), 1 - np.exp(-9 / 2.))
    smooth=0.9

    H = gaussian_filter(H, smooth)

    Hflat = H.flatten()
    inds = np.argsort(Hflat)[::-1]
    Hflat = Hflat[inds]
    sm = np.cumsum(Hflat)
    sm /= sm[-1]
    V = np.empty(len(levels))
    for i, v0 in enumerate(levels):
        try:
            V[i] = Hflat[sm <= v0][-1]
        except IndexError:
            V[i] = Hflat[0]
    V.sort()
    m = np.diff(V) == 0
    if np.any(m) and not quiet:
        logging.warning("Too few points to create valid contours")
    while np.any(m):
        V[np.where(m)[0][0]] *= 1.0 - 1e-4
        m = np.diff(V) == 0
    V.sort()

    # Compute the bin centers.
    X1, Y1 = 0.5 * (X[1:] + X[:-1]), 0.5 * (Y[1:] + Y[:-1])

    # Extend the array for the sake of the contours at the plot edges.
    H2 = H.min() + np.zeros((H.shape[0] + 4, H.shape[1] + 4))
    H2[2:-2, 2:-2] = H
    H2[2:-2, 1] = H[:, 0]
    H2[2:-2, -2] = H[:, -1]
    H2[1, 2:-2] = H[0]
    H2[-2, 2:-2] = H[-1]
    H2[1, 1] = H[0, 0]
    H2[1, -2] = H[0, -1]
    H2[-2, 1] = H[-1, 0]
    H2[-2, -2] = H[-1, -1]
    X2 = np.concatenate(
        [
            X1[0] + np.array([-2, -1]) * np.diff(X1[:2]),
            X1,
            X1[-1] + np.array([1, 2]) * np.diff(X1[-2:]),
        ]
    )
    Y2 = np.concatenate(
        [
            Y1[0] + np.array([-2, -1]) * np.diff(Y1[:2]),
            Y1,
            Y1[-1] + np.array([1, 2]) * np.diff(Y1[-2:]),
        ]
    )

    ax = plt.gca()
    contour_arr = ax.contour(X2, Y2, H2.T, V)

    if maxmin:
        for arr in contour_arr.allsegs:
            for el in arr:
                el[:,0].clip(*maxmin[0], el[:,0])
                el[:,1].clip(*maxmin[1], el[:,1])

    contour_list = [[el.tolist() for el in arr] for arr in contour_arr.allsegs]

    return contour_list

def histogram_contour(result, bins=50):
    """
    Takes in values of 1D posterior values. Converts this to histogram -> line path of histogram.
    
    default bin counts as given in bilby.core.result.plot_single_density. Feel free to change or make this into a kwargs

    Input:  result (bilby.core.result.posterior[keys].value object)

    Output: num_of_keys histogram paths given as a list of [x,y] coords. Similar format to contour, [[hist1], [hist2], [histN]]
            hist maxmins in [[hist1], [hist2], [histN]] format, where [hist1] = [min, max]. This is to reduce amount of calculations in the front end.
    """
    def _parse_input(xs):
        xs = np.atleast_1d(xs)
        if len(xs.shape) == 1:
            xs = np.atleast_2d(xs)
        else:
            assert len(xs.shape) == 2, "The input sample array must be 1- or 2-D."
            xs = xs.T
        return xs

    def _histogram_to_line(n, bin_edges):
        '''
        Convert (n, bin_edges) to (x,y) coordinates of histogram shape
        '''
        x_coords = np.repeat(bin_edges, 2)
        y_coords = np.concatenate(([0], np.repeat(n, 2), [0]))    
        return x_coords, y_coords

    xs = _parse_input(result)
    hist_range = [[x.min(), x.max()] for x in xs]

    hist_bin_factor=1
    bins = [int(bins) for _ in hist_range]
    hist_bin_factor = [float(hist_bin_factor) for _ in hist_range]

    counts_arr = []
    bin_edges_arr =[]

    for i, x in enumerate(xs):
        bins_1d = int(max(1, np.round(hist_bin_factor[i] * bins[i])))
        n, bin_edges = np.histogram(
            x,
            bins=bins_1d,
            weights=None,
            range=np.sort(hist_range[i]),
            density=True,
        )
        
        counts_arr.append(n)
        bin_edges_arr.append(bin_edges)

    hist_arr = []
    hist_maxmin = []

    for i, _ in enumerate(counts_arr):
        x_temp, y_temp = _histogram_to_line(counts_arr[i], bin_edges_arr[i])
        hist_arr.append( [[x_temp[j], y_temp[j]] for j in range(len(x_temp))] )
        hist_maxmin.append([np.min(x_temp), np.max(x_temp)])

    return hist_arr, hist_maxmin

def result_to_json(result):
    """
    Convert a bilby MCMC output (bilby.core.sampler.run_sampler) into contour/histogram coordinates to pass to the frontend.
    For ease of plotting, returns max-min of plots to save time calculating on the front-end.
    For ease of plotting, also returns Median +/- for each parameter.
    """
    result_values = result.posterior[result.search_parameter_keys].values
    param_counts = len(result.search_parameter_keys)

    contour_arr = []
    param_error = []
    hist_arr, hist_maxmin = histogram_contour(result_values)

    for i in range(param_counts):
        for j in range(param_counts):
            if i < j:
                contour_arr.append(corner_contour(result_values, i, j, [hist_maxmin[i], hist_maxmin[j]]))

    for i in result.search_parameter_keys:
        summary = result.get_one_dimensional_median_and_error_bar(i, quantiles=[0.16,0.84])
        param_error.append([i, summary.median, summary.minus, summary.plus])


    json_object = {
        'hist_data': hist_arr,
        'contour_data': contour_arr,
        'hist_maxmin': hist_maxmin,
        'param_error': param_error
    }

    return json_object


if __name__ == "__main__":
    """
    Example run using one of bilby's example
    """
    result = sample_bilby.sample_bilby_run()
    json_output = result_to_json(result)

    #Pass it down as a context using a django backend.
    context = {
        "b": json_output
    }
