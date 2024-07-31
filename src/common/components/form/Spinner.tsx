import React from 'react';

const Spinner = ({
	type = 'border'
}: SpinnerProps) =>
{
    return (
        <div
            className='Spinner'
            role='status'
            aria-live='polite'
            aria-label='Loading...'
        >
            {type === 'dot' && (
                <div className='lds-default'>
                    <div/>
                    <div/>
                    <div/>
                    <div/>
                    <div/>
                    <div/>
                    <div/>
                    <div/>
                    <div/>
                    <div/>
                    <div/>
                    <div/>
                </div>
            )}
            {type === 'border' && (
                <div className='lds-ring'>
                    <div/>
                    <div/>
                    <div/>
                    <div/>
                </div>
            )}
        </div>
    );
}

type SpinnerProps = {
	type?: 'dot' | 'border'
};

export default Spinner;