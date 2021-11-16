"""
Sample bilby run taken from https://git.ligo.org/lscsoft/bilby/blob/master/examples/tutorials/visualising_the_results.ipynb
"""
import bilby
import matplotlib.pyplot as plt
import numpy as np

def sample_bilby_run():

    time_duration = 4.                     # time duration (seconds)
    sampling_frequency = 2048.             # sampling frequency (Hz)
    outdir = 'visualising_the_results'     # directory in which to store output
    label = 'example'                      # identifier to apply to output files

    np.random.seed(88170235)

    # specify injection parameters
    injection_parameters = dict(
    mass_1=36.,                          # detector frame (redshifted) primary mass (solar masses)
    mass_2=29.,                          # detector frame (redshifted) secondary mass (solar masses)
    a_1=0.4,                             # primary dimensionless spin magnitude
    a_2=0.3,                             # secondary dimensionless spin magnitude
    tilt_1=0.5,                          # polar angle between primary spin and the orbital angular momentum (radians)
    tilt_2=1.0,                          # polar angle between secondary spin and the orbital angular momentum 
    phi_12=1.7,                          # azimuthal angle between primary and secondary spin (radians)
    phi_jl=0.3,                          # azimuthal angle between total angular momentum and orbital angular momentum (radians)
    luminosity_distance=200.,            # luminosity distance to source (Mpc)
    theta_jn=0.4,                        # inclination angle between line of sight and orbital angular momentum (radians)
    phase=1.3,                           # phase (radians)
    ra=1.375,                            # source right ascension (radians)
    dec=-1.2108,                         # source declination (radians)
    geocent_time=1126259642.413,         # reference time at geocentre (time of coalescence or peak amplitude) (GPS seconds)
    psi=2.659                            # gravitational wave polarisation angle
    )

    # specify waveform arguments
    waveform_arguments = dict(
    waveform_approximant='IMRPhenomPv2', # waveform approximant name
    reference_frequency=50.,             # gravitational waveform reference frequency (Hz)
    )

    # set up the waveform generator
    waveform_generator = bilby.gw.waveform_generator.WaveformGenerator(
        sampling_frequency=sampling_frequency, duration=time_duration,
        frequency_domain_source_model=bilby.gw.source.lal_binary_black_hole,
        parameters=injection_parameters, waveform_arguments=waveform_arguments)
    # create the frequency domain signal
    hf_signal = waveform_generator.frequency_domain_strain()

    # initialise an interferometer based on LIGO Hanford, complete with simulated noise and injected signal
    IFOs = [bilby.gw.detector.get_interferometer_with_fake_noise_and_injection(
        'H1', injection_polarizations=hf_signal, injection_parameters=injection_parameters, duration=time_duration,
        sampling_frequency=sampling_frequency, outdir=outdir)]

    # first, set up all priors to be equal to a delta function at their designated value
    priors = bilby.gw.prior.BBHPriorDict(injection_parameters.copy())
    # then, reset the priors on the masses and luminosity distance to conduct a search over these parameters
    priors['mass_1'] = bilby.core.prior.Uniform(20, 50, 'mass_1')
    priors['mass_2'] = bilby.core.prior.Uniform(20, 50, 'mass_2')
    priors['luminosity_distance'] = bilby.core.prior.Uniform(100, 300, 'luminosity_distance')

    # compute the likelihoods
    likelihood = bilby.gw.likelihood.GravitationalWaveTransient(interferometers=IFOs, waveform_generator=waveform_generator)

    result = bilby.core.sampler.run_sampler(likelihood=likelihood, priors=priors, sampler='dynesty', npoints=100,
                                    injection_parameters=injection_parameters, outdir=outdir, label=label,
                                    walks=5)

    return result