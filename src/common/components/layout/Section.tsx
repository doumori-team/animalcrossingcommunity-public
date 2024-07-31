import React from 'react';

const Section = ({
	children
}: SectionProps) =>
{
    return (
        <div className='Section'>
            {children}
        </div>
    );
}

type SectionProps = {
	children: React.ReactNode | string
};

export default Section;