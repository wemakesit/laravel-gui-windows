import React, { forwardRef } from 'react';
import { Transition } from '@headlessui/react';

interface StepTransitionProps {
    show: boolean;
    direction?: 'forward' | 'backward';
    children: React.ReactNode;
}

const StepTransition = forwardRef<HTMLDivElement, StepTransitionProps>(
    ({ show, direction = 'forward', children }, ref) => {
        return (
            <Transition
                show={show}
                enter="transition-all duration-300 ease-in-out"
                enterFrom={`opacity-0 ${direction === 'forward' ? 'translate-x-8' : '-translate-x-8'}`}
                enterTo="opacity-100 translate-x-0"
                leave="transition-all duration-300 ease-in-out"
                leaveFrom="opacity-100 translate-x-0"
                leaveTo={`opacity-0 ${direction === 'forward' ? '-translate-x-8' : 'translate-x-8'}`}
                className="w-full"
                as="div"
                ref={ref}
            >
                {children}
            </Transition>
        );
    }
);

// Add display name for better debugging
StepTransition.displayName = 'StepTransition';

export default StepTransition;
