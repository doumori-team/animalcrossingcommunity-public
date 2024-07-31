import React, { useRef, useState } from 'react';

import FontAwesomeIcon from '@/components/layout/FontAwesomeIcon.tsx';
import { RequireClientJS } from '@behavior';
import { ClickHandlerButtonType } from '@types';

const AccordionItem = ({
	title,
	description,
	isOpen,
	onClick
}: AccordionItemProps) => {
	const contentHeight = useRef<any>();

	return(
		<div className='AccordionItem'>
			<button className={`title-container ${isOpen ? 'active' : ''}`} onClick={onClick}>
				<p className='title-content'>{title}</p>
				{isOpen ?
					<FontAwesomeIcon name='chevron-up' alt='chevron-up' /> :
					<FontAwesomeIcon name='chevron-down' alt='chevron-down' />}
			</button>

			<div ref={contentHeight} className='description-container' style={
				isOpen ? { height: contentHeight.current.scrollHeight } : { height: '0' }
			}>
				<p className='description-content'>
					{description}
				</p>
			</div>
		</div>
	)
}

type AccordionItemProps = {
	title: string,
	description: string
	isOpen: boolean
	onClick: ClickHandlerButtonType
}

const Accordion = ({data}: {data: AccordionData[]}) => {
	const [active, setActive] = useState<number|null>(null);

	return (
		<div className='Accordion'>
			{data.map((item, index) => (
				<RequireClientJS fallback={item.fallback}>
					<AccordionItem
						key={index}
						title={item.title}
						description={item.description}
						isOpen={active === index}
						onClick={() => setActive((prevIndex) => (prevIndex === index ? null : index))}
					/>
				</RequireClientJS>
			))}
		</div>
	);
};

type AccordionData = {
	title: string
	description: any
	fallback: any
}

export default Accordion;
