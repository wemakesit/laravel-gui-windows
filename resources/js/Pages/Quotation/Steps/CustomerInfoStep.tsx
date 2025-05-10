import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function CustomerInfoStep({ customerInfo, updateCustomerInfo, validateStep }) {
    const [formData, setFormData] = useState(customerInfo);
    const [errors, setErrors] = useState({});
    const [isValid, setIsValid] = useState(false);
    const [postcode, setPostcode] = useState('');
    const [isLookingUpPostcode, setIsLookingUpPostcode] = useState(false);
    const [addressOptions, setAddressOptions] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState('');
    const [showManualAddress, setShowManualAddress] = useState(false);

    // Use ref to track previous validation state to prevent unnecessary updates
    const prevValidRef = useRef(false);

    // Use ref to track if initial validation has run
    const initialValidationDoneRef = useRef(false);

    // Add a ref to track if an update is coming from the parent
    const isParentUpdateRef = useRef(false);

    // Function to validate form data - defined outside useEffect to avoid duplication
    const validateFormData = () => {
        const newErrors = {};

        // Required fields validation
        if (!formData.first_name?.trim()) newErrors.first_name = 'First name is required';
        if (!formData.last_name?.trim()) newErrors.last_name = 'Last name is required';
        if (!formData.email?.trim()) newErrors.email = 'Email is required';
        if (!formData.phone?.trim()) newErrors.phone = 'Phone is required';
        if (!formData.address?.trim()) newErrors.address = 'Address is required';

        // Email validation
        if (formData.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Phone validation (basic)
        if (formData.phone?.trim() && !/^[0-9+\s()-]{10,15}$/.test(formData.phone)) {
            newErrors.phone = 'Please enter a valid phone number';
        }

        return newErrors;
    };

    // Run initial validation when component mounts
    useEffect(() => {
        console.log('CustomerInfoStep: Initial mount with customerInfo', customerInfo);

        // Validate the form data
        const newErrors = validateFormData();
        setErrors(newErrors);

        // Check if the form is valid
        const valid = Object.keys(newErrors).length === 0;
        setIsValid(valid);

        // Set initial validation state
        if (validateStep) {
            validateStep(1, valid);
            prevValidRef.current = valid;
        }

        // Mark initial validation as done
        initialValidationDoneRef.current = true;
    }, []); // Empty dependency array means this runs once on mount

    // Validate form data when fields change
    useEffect(() => {
        // Skip validation if initial validation hasn't run yet
        if (!initialValidationDoneRef.current) {
            return;
        }

        // Validate the form data
        const newErrors = validateFormData();
        setErrors(newErrors);

        // Check if the form is valid
        const valid = Object.keys(newErrors).length === 0;
        setIsValid(valid);

        // Only update parent component if validation status has changed
        if (validateStep && valid !== prevValidRef.current) {
            validateStep(1, valid);
            // Update the ref with current validation state
            prevValidRef.current = valid;
        }
    }, [
        formData.first_name,
        formData.last_name,
        formData.email,
        formData.phone,
        formData.address
    ]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Create the updated data
        const updatedData = { ...formData, [name]: value };
        // Update local state
        setFormData(updatedData);

        // Only update parent component if this is not an update from the parent
        if (isParentUpdateRef.current) {
            // Reset the ref for future user interactions
            isParentUpdateRef.current = false;
            return;
        }

        // Only update parent component after state is set
        // This prevents the infinite update loop
        setTimeout(() => {
            updateCustomerInfo(updatedData);
        }, 0);
    };

    // State to store API configuration
    // eslint-disable-next-line no-unused-vars
    const [addressApiConfig, setAddressApiConfig] = useState({
        url: ''
    });

    // Fetch the address API configuration when component mounts
    useEffect(() => {
        const fetchAddressApiConfig = async () => {
            try {
                const response = await axios.get('/api/address-config');
                setAddressApiConfig(response.data);
            } catch (error) {
                console.error('Failed to fetch address API configuration:', error);
            }
        };

        fetchAddressApiConfig();
    }, []);

    // Update local state when customerInfo changes (e.g., when a saved quotation is loaded)
    useEffect(() => {
        // Skip if customerInfo is empty
        if (customerInfo && Object.keys(customerInfo).length > 0) {
            // Create a normalized copy of customerInfo with title defaulted to empty string if undefined
            const normalizedCustomerInfo = {
                ...customerInfo,
                title: customerInfo.title || ''
            };

            // Create a normalized copy of formData with title defaulted to empty string if undefined
            const normalizedFormData = {
                ...formData,
                title: formData.title || ''
            };

            // Check if the normalized objects are different to prevent infinite loops
            const customerInfoStr = JSON.stringify(normalizedCustomerInfo);
            const formDataStr = JSON.stringify(normalizedFormData);

            console.log('CustomerInfoStep: Comparing normalized data');
            console.log('CustomerInfoStep: normalizedCustomerInfo.title =', normalizedCustomerInfo.title);
            console.log('CustomerInfoStep: normalizedFormData.title =', normalizedFormData.title);

            if (customerInfoStr !== formDataStr) {
                console.log('CustomerInfoStep: Updating formData from customerInfo prop');
                isParentUpdateRef.current = true;
                setFormData(normalizedCustomerInfo);
            }
        }
    }, [customerInfo, formData]);

    const lookupPostcode = async () => {
        if (!postcode.trim()) {
            setErrors(prevErrors => ({...prevErrors, postcode: 'Please enter a postcode'}));
            return;
        }

        setIsLookingUpPostcode(true);
        setErrors(prevErrors => ({...prevErrors, postcode: null}));

        try {
            // Use our backend endpoint to handle the Postcodes.io API request
            const response = await axios.get('/api/address-lookup', {
                params: {
                    postcode: postcode.trim()
                }
            });

            if (response.data && response.data.addresses && response.data.addresses.length > 0) {
                setAddressOptions(response.data.addresses);
            } else {
                setErrors(prevErrors => ({...prevErrors, postcode: 'No addresses found for this postcode'}));
                setAddressOptions([]);
            }
        } catch (error) {
            console.error('Postcode lookup error:', error);

            // Provide more specific error messages based on the error
            if (error.response) {
                if (error.response.status === 404) {
                    setErrors(prevErrors => ({
                        ...prevErrors,
                        postcode: 'No addresses found for this postcode. Please check the postcode or enter address manually.'
                    }));
                } else if (error.response.status === 400) {
                    setErrors(prevErrors => ({
                        ...prevErrors,
                        postcode: error.response.data?.error || 'Invalid postcode format. Please enter a valid UK postcode.'
                    }));
                } else {
                    setErrors(prevErrors => ({
                        ...prevErrors,
                        postcode: error.response.data?.error || 'Error from Postcodes.io API. Please try again or enter address manually.'
                    }));
                }
            } else if (error.request) {
                setErrors(prevErrors => ({
                    ...prevErrors,
                    postcode: 'Could not connect to address lookup service. Please try again later or enter address manually.'
                }));
            } else {
                setErrors(prevErrors => ({
                    ...prevErrors,
                    postcode: 'Error looking up postcode. Please try again or enter address manually.'
                }));
            }

            setAddressOptions([]);
        } finally {
            setIsLookingUpPostcode(false);
        }
    };

    const handleAddressSelect = (e) => {
        const selectedValue = e.target.value;
        setSelectedAddress(selectedValue);

        if (selectedValue) {
            const selectedOption = addressOptions.find(option => option.id.toString() === selectedValue);
            if (selectedOption) {
                // Create the updated data outside the setState callback
                const updatedData = { ...formData, address: selectedOption.text };
                // Update local state
                setFormData(updatedData);

                // Only update parent component if this is not an update from the parent
                if (isParentUpdateRef.current) {
                    // Reset the ref for future user interactions
                    isParentUpdateRef.current = false;
                    return;
                }

                // Use setTimeout to prevent infinite update loop
                setTimeout(() => {
                    updateCustomerInfo(updatedData);
                }, 0);
            }
        }
    };

    const toggleManualAddress = () => {
        setShowManualAddress(!showManualAddress);
        if (!showManualAddress) {
            setPostcode('');
            setAddressOptions([]);
            setSelectedAddress('');
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">Customer Information</h2>
            <p className="text-gray-600">Please enter the customer's details for the quotation.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                    <select
                        id="title"
                        name="title"
                        value={formData.title || ''} // Ensure title is defaulted to empty string
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            console.log('Title changed to:', e.target.value);
                            handleChange(e);
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                        <option value="">Select a title</option>
                        <option value="Mr">Mr</option>
                        <option value="Mrs">Mrs</option>
                        <option value="Miss">Miss</option>
                        <option value="Ms">Ms</option>
                        <option value="Dr">Dr</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                        First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="first_name"
                        name="first_name"
                        value={formData.first_name || ''}
                        onChange={handleChange}
                        required
                        className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                            errors.first_name ? 'border-red-300' : 'border-gray-300'
                        }`}
                    />
                    {errors.first_name && (
                        <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                        Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="last_name"
                        name="last_name"
                        value={formData.last_name || ''}
                        onChange={handleChange}
                        required
                        className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                            errors.last_name ? 'border-red-300' : 'border-gray-300'
                        }`}
                    />
                    {errors.last_name && (
                        <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email || ''}
                        onChange={handleChange}
                        required
                        className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                            errors.email ? 'border-red-300' : 'border-gray-300'
                        }`}
                    />
                    {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone || ''}
                        onChange={handleChange}
                        required
                        className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                            errors.phone ? 'border-red-300' : 'border-gray-300'
                        }`}
                    />
                    {errors.phone && (
                        <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                    )}
                </div>

                <div className="md:col-span-2">
                    <div className="flex justify-between items-center">
                        <label htmlFor={showManualAddress ? "address" : "postcode"} className="block text-sm font-medium text-gray-700">
                            Address <span className="text-red-500">*</span>
                        </label>
                        <button
                            type="button"
                            onClick={toggleManualAddress}
                            className="text-sm text-blue-600 hover:text-blue-800"
                        >
                            {showManualAddress ? 'Use Postcode Lookup' : 'Enter Address Manually'}
                        </button>
                    </div>

                    {!showManualAddress ? (
                        <div className="space-y-4 mt-2">
                            <div className="flex space-x-2">
                                <div className="flex-grow">
                                    <input
                                        type="text"
                                        id="postcode"
                                        name="postcode"
                                        autoComplete="postal-code"
                                        placeholder="Enter postcode (e.g. SW1A 1AA)"
                                        value={postcode}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPostcode(e.target.value)}
                                        className={`block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                                            errors.postcode ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.postcode && (
                                        <p className="mt-1 text-sm text-red-600">{errors.postcode}</p>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={lookupPostcode}
                                    disabled={isLookingUpPostcode || !postcode.trim()}
                                    className={`px-4 py-2 rounded-md ${
                                        isLookingUpPostcode || !postcode.trim()
                                            ? 'bg-blue-300 text-white cursor-not-allowed'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                                >
                                    {isLookingUpPostcode ? 'Looking up...' : 'Find Address'}
                                </button>
                            </div>

                            {addressOptions.length > 0 && (
                                <div className="bg-blue-50 p-4 rounded-md">
                                    <label htmlFor="address_select" className="block text-sm font-medium text-gray-700 mb-2">
                                        Select an address from the list:
                                    </label>
                                    <select
                                        id="address_select"
                                        name="address_select"
                                        value={selectedAddress}
                                        onChange={handleAddressSelect}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        <option value="">-- Please select --</option>
                                        {addressOptions.map(option => (
                                            <option key={option.id} value={option.id}>
                                                {option.text}
                                            </option>
                                        ))}
                                    </select>

                                    <p className="mt-2 text-xs text-gray-500">
                                        Select your address from the list above or enter it manually if not listed.
                                    </p>

                                    {/* No API key warning needed for postcodes.io as it's a free service */}
                                </div>
                            )}

                            {formData.address && (
                                <div className="bg-green-50 p-4 rounded-md">
                                    <div className="flex justify-between items-center mb-2">
                                        <label htmlFor="address_display" className="block text-sm font-medium text-gray-700">
                                            Selected Address
                                        </label>
                                        <button
                                            type="button"
                                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                                // Create the updated data outside the setState callback
                                                const updatedData = {...formData, address: ''};
                                                // Update local state
                                                setFormData(updatedData);

                                                // Only update parent component if this is not an update from the parent
                                                if (!isParentUpdateRef.current) {
                                                    // Use setTimeout to prevent infinite update loop
                                                    setTimeout(() => {
                                                        updateCustomerInfo(updatedData);
                                                    }, 0);
                                                } else {
                                                    // Reset the ref for future user interactions
                                                    isParentUpdateRef.current = false;
                                                }

                                                setSelectedAddress('');
                                            }}
                                            className="text-xs text-red-600 hover:text-red-800"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                    <textarea
                                        id="address_display"
                                        value={formData.address}
                                        readOnly
                                        rows={3}
                                        className="mt-1 block w-full rounded-md border-gray-300 bg-white shadow-sm"
                                    />
                                </div>
                            )}

                            {!formData.address && addressOptions.length === 0 && !isLookingUpPostcode && postcode && (
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm text-yellow-700">
                                                Enter a valid UK postcode and click "Find Address" to see available addresses.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="mt-2">
                            <textarea
                                id="address"
                                name="address"
                                value={formData.address || ''}
                                onChange={handleChange}
                                required
                                rows={3}
                                placeholder="Enter full address including postcode"
                                className={`block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                                    errors.address ? 'border-red-300' : 'border-gray-300'
                                }`}
                            />
                            {errors.address && (
                                <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                            )}
                        </div>
                    )}
                </div>

                <div className="md:col-span-2">
                    <label htmlFor="additional_info" className="block text-sm font-medium text-gray-700">
                        Additional Information
                    </label>
                    <textarea
                        id="additional_info"
                        name="additional_info"
                        value={formData.additional_info || ''}
                        onChange={handleChange}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>
            </div>

            {!isValid && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                Please fill in all required fields marked with an asterisk (*) to proceed.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
