import React, { useRef, useState } from 'react';

import FontAwesomeIcon from './FontAwesomeIcon.js';
import { RequireClientJS } from '@behavior';

const AccordionItem = ({title, description, isOpen, onClick}) => {
	const contentHeight = useRef();

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

const Accordion = ({data}) => {
	const [active, setActive] = useState(null);

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

export default Accordion;
