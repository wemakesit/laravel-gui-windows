import React, { useState, useEffect, Fragment } from 'react';
import { Combobox, Transition } from '@headlessui/react';

export default function WindowForm({ windowData, windowTypes, onSave, onCancel }) {
    const defaultWindow = {
        room: '',
        type: '',
        quantity: 1,
        glass_specification: '',
        paint_finish: '',
        hardware_finish: '',
        cost: 0,
        extras: [],
        options: 1, // Default to option 1 (can be changed in the Options step)
        additional_info: ''
    };

    const [formData, setFormData] = useState(windowData || defaultWindow);
    const [selectedType, setSelectedType] = useState(null);

    // For searchable window type dropdown
    const [windowTypeQuery, setWindowTypeQuery] = useState('');

    // For room dropdown with freetext
    const [roomQuery, setRoomQuery] = useState(windowData?.room || '');
    const [commonRooms] = useState([
        'Living Room', 'Kitchen', 'Dining Room', 'Bedroom', 'Bathroom',
        'Master Bedroom', 'Office', 'Hallway', 'Conservatory', 'Utility Room'
    ]);

    useEffect(() => {
        if (formData.type && windowTypes?.window_types) {
            const type = windowTypes.window_types.find(t => t.Type === formData.type);
            if (type) {
                setSelectedType(type);
                if (!windowData) {
                    setFormData(prev => ({
                        ...prev,
                        cost: type.Cost || type.BasePrice || 0
                    }));
                }
            }
        }
    }, [formData.type, windowTypes, windowData]);

    // Initialize room query from window data
    useEffect(() => {
        if (windowData?.room) {
            setRoomQuery(windowData.room);
        }
    }, [windowData]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'quantity') {
            setFormData({
                ...formData,
                quantity: parseInt(value, 10) || 1
            });
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };

    // Handle window type selection from combobox
    const handleWindowTypeChange = (selectedValue) => {
        if (selectedValue && windowTypes?.window_types) {
            const type = windowTypes.window_types.find(t => t.Type === selectedValue);
            if (type) {
                setFormData({
                    ...formData,
                    type: selectedValue,
                    cost: type.Cost || type.BasePrice || 0
                });
            } else {
                setFormData({
                    ...formData,
                    type: selectedValue
                });
            }
        }
    };

    // Handle room selection or freetext input
    const handleRoomChange = (selectedRoom) => {
        setRoomQuery(selectedRoom);
        setFormData({
            ...formData,
            room: selectedRoom
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    // Filter window types based on search query
    const filteredWindowTypes = windowTypeQuery === ''
        ? windowTypes?.window_types || []
        : windowTypes?.window_types?.filter((type) =>
            type.Type.toLowerCase().includes(windowTypeQuery.toLowerCase())
        );

    // Filter room suggestions based on search query
    const filteredRooms = roomQuery === ''
        ? commonRooms
        : commonRooms.filter((room) =>
            room.toLowerCase().includes(roomQuery.toLowerCase())
        );

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="room" className="block text-sm font-medium text-gray-700">Room</label>
                    <Combobox value={formData.room} onChange={handleRoomChange}>
                        <div className="relative mt-1">
                            <div className="relative w-full cursor-default overflow-hidden rounded-md border border-gray-300 bg-white text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-300 sm:text-sm">
                                <Combobox.Input
                                    id="room"
                                    name="room"
                                    className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                                    displayValue={(room) => room}
                                    onChange={(e) => setRoomQuery(e.target.value)}
                                    required
                                />
                                <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </Combobox.Button>
                            </div>
                            <Transition
                                as={Fragment}
                                leave="transition ease-in duration-100"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                                afterLeave={() => setRoomQuery('')}
                            >
                                <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                    {filteredRooms.length === 0 && roomQuery !== '' ? (
                                        <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                            Using custom room name.
                                        </div>
                                    ) : (
                                        filteredRooms.map((room) => (
                                            <Combobox.Option
                                                key={room}
                                                className={({ active }) =>
                                                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                        active ? 'bg-blue-600 text-white' : 'text-gray-900'
                                                    }`
                                                }
                                                value={room}
                                            >
                                                {({ selected, active }) => (
                                                    <>
                                                        <span
                                                            className={`block truncate ${
                                                                selected ? 'font-medium' : 'font-normal'
                                                            }`}
                                                        >
                                                            {room}
                                                        </span>
                                                        {selected ? (
                                                            <span
                                                                className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                                    active ? 'text-white' : 'text-blue-600'
                                                                }`}
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                                </svg>
                                                            </span>
                                                        ) : null}
                                                    </>
                                                )}
                                            </Combobox.Option>
                                        ))
                                    )}
                                </Combobox.Options>
                            </Transition>
                        </div>
                    </Combobox>
                </div>

                <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">Window Type</label>
                    <Combobox value={formData.type} onChange={handleWindowTypeChange}>
                        <div className="relative mt-1">
                            <div className="relative w-full cursor-default overflow-hidden rounded-md border border-gray-300 bg-white text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-300 sm:text-sm">
                                <Combobox.Input
                                    id="type"
                                    name="type"
                                    className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                                    displayValue={(type) => type || ''}
                                    onChange={(e) => setWindowTypeQuery(e.target.value)}
                                    required
                                />
                                <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </Combobox.Button>
                            </div>
                            <Transition
                                as={Fragment}
                                leave="transition ease-in duration-100"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                                afterLeave={() => setWindowTypeQuery('')}
                            >
                                <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                    {filteredWindowTypes.length === 0 && windowTypeQuery !== '' ? (
                                        <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                            No window types found.
                                        </div>
                                    ) : (
                                        filteredWindowTypes.map((type, index) => (
                                            <Combobox.Option
                                                key={index}
                                                className={({ active }) =>
                                                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                        active ? 'bg-blue-600 text-white' : 'text-gray-900'
                                                    }`
                                                }
                                                value={type.Type}
                                            >
                                                {({ selected, active }) => (
                                                    <>
                                                        <span
                                                            className={`block truncate ${
                                                                selected ? 'font-medium' : 'font-normal'
                                                            }`}
                                                        >
                                                            {type.Type} - £{type.Cost ? type.Cost.toFixed(2) : (type.BasePrice ? type.BasePrice.toFixed(2) : '0.00')}
                                                        </span>
                                                        {selected ? (
                                                            <span
                                                                className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                                    active ? 'text-white' : 'text-blue-600'
                                                                }`}
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                                </svg>
                                                            </span>
                                                        ) : null}
                                                    </>
                                                )}
                                            </Combobox.Option>
                                        ))
                                    )}
                                </Combobox.Options>
                            </Transition>
                        </div>
                    </Combobox>
                </div>

                <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
                    <input
                        type="number"
                        id="quantity"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        min="1"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>

                {selectedType && (
                    <div className="md:col-span-2">
                        <div className="bg-gray-50 p-4 rounded-md">
                            <h3 className="font-medium text-gray-900">{selectedType.Type}</h3>
                            <p className="text-gray-600 mt-1">{selectedType.Description || 'No description available'}</p>
                            <p className="text-gray-900 mt-2">Price: £{selectedType.Cost ? selectedType.Cost.toFixed(2) : (selectedType.BasePrice ? selectedType.BasePrice.toFixed(2) : '0.00')}</p>
                        </div>
                    </div>
                )}

                <div className="md:col-span-2">
                    <label htmlFor="additional_info" className="block text-sm font-medium text-gray-700">Additional Information</label>
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

            <div className="flex justify-end space-x-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Save Window
                </button>
            </div>
        </form>
    );
}
