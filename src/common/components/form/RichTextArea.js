import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import PhotoAlbum from 'react-photo-album';
import Compressor from 'compressorjs';

import * as markup from 'common/markup.js';
import { RequireClientJS, RequirePermission } from '@behavior';
import Markup from '@/components/layout/Markup.js';
import MarkupButton from '@/components/form/MarkupButton.js';
import Select from '@/components/form/Select.js';
import { constants } from '@utils';
import EmojiButton from '@/components/form/EmojiButton.js';
import emojiDefs from 'common/markup/emoji.json' assert { type: 'json'};
import { emojiSettingsShape, fileShape } from '@propTypes';
import { ErrorMessage, Tabs } from '@layout';
import FontAwesomeIcon from '@/components/layout/FontAwesomeIcon.js';
import * as iso from 'common/iso.js';
import { UserContext } from '@contexts';
import Text from '@/components/form/Text.js';
import Form from '@/components/form/Form.js';
import Spinner from '@/components/form/Spinner.js';

// Combined form control for rich text. Includes keyboard shortcuts for bold/italic/underline, etc
// Props:
// - textName (string): name to be assigned to the form control for the text itself
// - textValue (string): optional starting value for the text itself
// - formatName (string): name to be assigned to the form control for the markup type
// - htmlId (string}: optional id parameter for accessibility with <label> elements
// - formatValue (string): optional starting value for format
// - emojiSettings (array): user emoji settings, for preview and gendered emojis
const RichTextArea = ({emojiSettings, formatValue, textValue, formatName, htmlId,
	maxLength, label, placeholder, characterCount, hideEmojis, textName, required,
	upload, maxImages, files}) =>
{
	const [format, setFormat] = useState(formatValue);
	const [curTextValue, setCurTextValue] = useState(textValue);
	const [errors, setErrors] = useState([]);
	const [nodeFiles, setNodeFiles] = useState(files);
	const [loading, setLoading] = useState(false);

	const textareaRef = useRef(null);

	const onChangeFormat = (event) =>
	{
		setFormat(event.target.value);
	}

	const onChangeText = () =>
	{
		setCurTextValue(textareaRef.current?.value);
	}

	const onKeypress = (event) =>
	{
		// Check to see if Ctrl or Cmd was held
		if (event.ctrlKey || event.metaKey)
		{
			if (event.key === 'b')
			{
				event.preventDefault();
				event.stopPropagation();
				doQuickMarkup(getTagDetails('bold'));
			}
			else if (event.key === 'i')
			{
				event.preventDefault();
				event.stopPropagation();
				doQuickMarkup(getTagDetails('italic'));
			}
			else if (event.key === 'u')
			{
				event.preventDefault();
				event.stopPropagation();
				doQuickMarkup(getTagDetails('underline'));
			}
		}
	}

	const getTagDetails = (type) =>
	{
		if (format === 'markdown')
		{
			return markup.markdownTags[type];
		}
		else if (format === 'markdown+html')
		{
			return markup.markdownHtmlTags[type];
		}
		else if (format === 'bbcode' || format === 'bbcode+html')
		{
			return markup.traditionalTags[type];
		}

		return null;
	}

	const getEmojiTagDetails = (type) =>
	{
		if (format === 'markdown' || format === 'markdown+html')
		{
			return markup.markdownEmoji[type];
		}
		else if (format === 'bbcode' || format === 'bbcode+html')
		{
			return markup.traditionalEmoji[type];
		}

		return null;
	}

	const doEmojiMarkup = (tag) =>
	{
		const textarea = textareaRef.current;

		const {selectionStart, selectionEnd, value} = textarea;

		textarea.value =
			value.slice(0, selectionStart) + tag
			+ value.slice(selectionStart, selectionEnd)
			+ value.slice(selectionEnd);

		textarea.focus();

		onChangeText();
	}

	const doQuickMarkup = (tag) =>
	{
		const textarea = textareaRef.current;

		const {selectionStart, selectionEnd, value} = textarea;
		const {prefix, attrName} = tag;
		let { start, end } = tag; // These ones need to be writeable so we can modify them if there is an attribute
		let attrVal;

		if (attrName)
		{
			attrVal = window.prompt(`${attrName}:`);
			start = start.replace('$', attrVal);
			end = end.replace('$', attrVal);
		}

		if (start && end)
		{
			// This is a two-part tag
			// Insert the two parts around the currently selected text (if any)
			textarea.value =
				value.slice(0, selectionStart) + start
				+ value.slice(selectionStart, selectionEnd)
				+ end + value.slice(selectionEnd);
			textarea.setSelectionRange(selectionStart + start.length, selectionEnd + start.length);
			textarea.focus();
		}
		else if (prefix)
		{
			// This is a tag that comes at the start of a line
			// Place it on each line within the selection
			// (including on the line in which the selection begins)
			const currentLineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
			const lines = value.slice(selectionStart, selectionEnd).split('\n');
			textarea.value =
				value.slice(0, currentLineStart) + prefix
				+ value.slice(currentLineStart, selectionStart)
				+ lines.join('\n' + prefix) + value.slice(selectionEnd);
			textarea.setSelectionRange(
				selectionStart + prefix.length,
				selectionEnd + prefix.length * lines.length
			);
			textarea.focus();
		}

		onChangeText();
	}

	const scanFile = async (e) =>
	{
		setErrors([]);
		setLoading(true);

		const files = Array.from(e.target.files);

		if (nodeFiles.length + files.length > maxImages)
		{
			setLoading(false);
			setErrors(['too-many-files']);

			return;
		}

		let addFiles = [...nodeFiles];

		await Promise.all(files.map(async file => {
			const compressedFile = await compressImage(file);

			// 10000 KB / 10 MB max size
			if (compressedFile.size > 10000000)
			{
				setLoading(false);
				setErrors(['image-file-size-too-large']);

				return;
			}

			const fileName = await uploadImage(compressedFile);

			let img = new Image();
			img.src = URL.createObjectURL(compressedFile);
			await img.decode();

			addFiles.push({
				name: compressedFile.name.replace(/\.[^/.]+$/, ''),
				fileId: fileName,
				width: img.width,
				height: img.height
			});
		}));

		setNodeFiles(addFiles);
		setLoading(false);
	}

	const compressImage = async (file) =>
	{
		return new Promise((resolve, reject) => {
			new Compressor(file, {
				convertSize: 1000000,
				success: resolve,
				error: reject,
			});
		});
	}

	const uploadImage = async (file) =>
	{
		let params = new FormData();
		params.append('imageExtension', file.type.replace(/(.*)\//g, ''));

		return await iso.query(null, 'v1/users/upload_image', params)
			.then(async ({s3PresignedUrl, fileName}) =>
			{
				try
				{
					await axios.put(s3PresignedUrl, file, {headers: {'Content-Type': file.type}});

					return fileName;
				}
				catch (e)
				{
					console.error('Error attempting to upload.');
					console.error(e);

					setErrors(['bad-format']);
					setLoading(false);
				}
			})
			.catch(error =>
			{
				console.error('Error attempting to get presigned url.');
				console.error(error);

				setErrors(['bad-format']);
				setLoading(false);
			});
	}

	const removeFile = async(e, index) =>
	{
		e.preventDefault();

		let newFiles = [...nodeFiles];
		newFiles.splice(index, 1);
		setNodeFiles(newFiles);
	}

	const getQuickMarkupButtons = () =>
	{
		return (
			<div className='RichTextArea_quickMarkupButtons'>
				<RequireClientJS>
					<span className='RichTextArea_quickMarkupGroup'>
						<MarkupButton
							tag={getTagDetails('bold')}
							clickHandler={doQuickMarkup.bind(this)}
							name='Bold' keyHint='Ctrl+B' icon='bold'
						/>
						<MarkupButton
							tag={getTagDetails('italic')}
							clickHandler={doQuickMarkup.bind(this)}
							name='Italic' keyHint='Ctrl+I' icon='italic'
						/>
						<MarkupButton
							tag={getTagDetails('underline')}
							clickHandler={doQuickMarkup.bind(this)}
							name='Underline' keyHint='Ctrl+U' icon='underline'
						/>
						<MarkupButton
							tag={getTagDetails('strikethrough')}
							clickHandler={doQuickMarkup.bind(this)}
							name='Strikethrough' icon='strikethrough'
						/>
					</span>
					<span className='RichTextArea_quickMarkupGroup'>
						<MarkupButton
							tag={getTagDetails('colour')}
							clickHandler={doQuickMarkup.bind(this)}
							name='Color' icon='palette'
						/>
						<MarkupButton
							tag={getTagDetails('spoiler')}
							clickHandler={doQuickMarkup.bind(this)}
							name='Spoiler' icon='mask'
						/>
						<MarkupButton
							tag={getTagDetails('link')}
							clickHandler={doQuickMarkup.bind(this)}
							name='Link' icon='link'
						/>
						<MarkupButton
							tag={getTagDetails('monospace')}
							clickHandler={doQuickMarkup.bind(this)}
							name='Monospace' icon='code'
						/>
					</span>
					<span className='RichTextArea_quickMarkupGroup'>
						<MarkupButton
							tag={getTagDetails('heading')}
							clickHandler={doQuickMarkup.bind(this)}
							name='Heading' icon='heading'
						/>
						<MarkupButton
							tag={getTagDetails('quote')}
							clickHandler={doQuickMarkup.bind(this)}
							name='Quote' icon='quote-right'
						/>
						<MarkupButton
							tag={getTagDetails('list')}
							clickHandler={doQuickMarkup.bind(this)}
							name='List' icon='list-ul'
						/>
						<MarkupButton
							tag={getTagDetails('table')}
							clickHandler={doQuickMarkup.bind(this)}
							name='Table' icon='table'
						/>
					</span>
					<span className='RichTextArea_quickMarkupGroup'>
						<MarkupButton
							tag={getTagDetails('center')}
							clickHandler={doQuickMarkup.bind(this)}
							name='Center' icon='center'
						/>
						{format === 'markdown+html' && (
							<>
							<MarkupButton
								tag={getTagDetails('image')}
								clickHandler={doQuickMarkup.bind(this)}
								name='Image' icon='image'
							/>
							<MarkupButton
								tag={getTagDetails('anchor')}
								clickHandler={doQuickMarkup.bind(this)}
								name='Anchor' icon='anchor'
							/>
							</>
						)}
						{upload && (
							<RequirePermission permission='post-images' silent>
								<label
									className='MarkupButton'
									title='Image'
									aria-label='Image'
									for='uploadImage'
								>
									<FontAwesomeIcon name='image' alt='Image' />
								</label>
								<input
									id='uploadImage'
									type='file'
									accept='.png,.jpg,.jpeg'
									onChange={scanFile}
									name='files'
									multiple
								/>
							</RequirePermission>
						)}
					</span>
				</RequireClientJS>
			</div>
		)
	}

	const getMarkupStyle = () =>
	{
		return (
			<div className='RichTextArea_markupStyle'>
				<Select
					name={formatName}
					label='Markup style'
					value={format}
					changeHandler={onChangeFormat}
					options={[
						{value: 'markdown', label: 'Markdown'},
						{value: 'bbcode', label: 'Traditional'},
						{value: 'plaintext', label: 'No Markup'},
					]}
				/>
			</div>
		)
	}

	const renderPhoto = ({photo, layoutOptions, imageProps: {alt, style, ...restImageProps}}) =>
	{
		const [caption, setCaption] = useState(photo.description);

		return (
			<div
				style={{
					width: style?.width,
					padding: `${layoutOptions.padding - 2}px`,
					paddingBottom: 0,
				}}
				className='RichTextArea_file'
			>
				<button
					className='RichTextArea_fileRemove'
					title='Remove'
					aria-label='Remove'
					onClick={(e) => removeFile(e, photo.index)}
				>
					x
				</button>
				<img
					alt={alt} style={{ ...style, width: '100%', padding: 0, paddingBottom: `5px` }} {...restImageProps}
				/>
				<Form.Group>
					<Text
						label='Caption'
						name={`fileCaptions[${photo.index}]`}
						maxLength={constants.max.imageCaption}
						required
						value={caption}
						changeHandler={(e) => setCaption(e.target.value)}
					/>
				</Form.Group>
				<input
					type='hidden'
					name={`fileIds[${photo.index}]`}
					value={photo.fileId}
				/>
				<input
					type='hidden'
					name={`fileNames[${photo.index}]`}
					value={photo.name}
				/>
				<input
					type='hidden'
					name={`fileWidths[${photo.index}]`}
					value={photo.width}
				/>
				<input
					type='hidden'
					name={`fileHeights[${photo.index}]`}
					value={photo.height}
				/>
			</div>
		);
	};

	const getWriteSection = () =>
	{
		return (
			<>
			<RequireClientJS fallback={
				formatName && (
					<div className='RichTextArea_quickMarkup'>
						{getQuickMarkupButtons()}
						{getMarkupStyle()}
					</div>
				)
			}>
				<div className='RichTextArea_quickMarkup'>
					{getQuickMarkupButtons()}
					{formatName && (
						getMarkupStyle()
					)}
				</div>
			</RequireClientJS>
			<div className='RichTextArea_textarea'>
				<textarea
					className='RichTextArea_textbox'
					name={textName}
					id={htmlId}
					defaultValue={curTextValue}
					maxLength={maxLength}
					ref={textareaRef}
					onKeyDown={onKeypress}
					onChange={onChangeText}
					data-lpignore='true'
					aria-label={label}
					placeholder={placeholder}
					required={required}
				/>
				{!hideEmojis && (
					<RequireClientJS>
						<div className='RichTextArea_emoji'>
							{Object.keys(emojiDefs[0]).map((def, index) =>
								<EmojiButton
									key={index}
									tag={getEmojiTagDetails(def)}
									clickHandler={doEmojiMarkup.bind(this)}
									name={emojiDefs[0][def]}
									icon={emojiDefs[0][def]}
									type={def}
									emojiSettings={emojiSettings}
								/>
							)}
							<hr />
							{Object.keys(emojiDefs[1]).map((def, index) =>
								<EmojiButton
									key={index}
									tag={getEmojiTagDetails(def)}
									clickHandler={doEmojiMarkup.bind(this)}
									name={emojiDefs[1][def]}
									icon={emojiDefs[1][def]}
									type={def}
									emojiSettings={emojiSettings}
								/>
							)}
						</div>
					</RequireClientJS>
				)}
			</div>
			{characterCount && (
				<RequireClientJS>
					(Character count: {curTextValue.length} / {maxLength} max)
				</RequireClientJS>
			)}
			{loading && (
				<Spinner />
			)}
			{nodeFiles.length > 0 && (
				<UserContext.Consumer>
					{currentUser => currentUser && (
						<PhotoAlbum
							layout='columns'
							photos={nodeFiles.map((file, index) => {
								return {
									src: `${constants.USER_FILE_DIR}${currentUser.id}/${file.fileId}`,
									alt: file.caption,
									title: file.caption,
									width: file.width,
									height: file.height,
									fileId: file.fileId,
									name: file.name,
									index: index,
									description: file.caption,
								};
							})}
							spacing={5}
							padding={0}
							columns={4}
							renderPhoto={renderPhoto}
						/>
					)}
				</UserContext.Consumer>
			)}
			</>
		)
	}

	return (
		<div className='RichTextArea'>
			{errors.map(
				(identifier, index) =>
					(<ErrorMessage identifier={identifier} key={index} />)
			)}
			<Tabs defaultActiveKey='write' variant='light' fallback={getWriteSection()}>
				<Tabs.Tab eventKey='write' title='Write'>
					{getWriteSection()}
				</Tabs.Tab>
				<Tabs.Tab eventKey='preview' title='Preview'>
					<input type='hidden' name={textName} defaultValue={curTextValue} />
					<input type='hidden' name={formatName} defaultValue={format} />

					<div className='RichTextArea_preview'>
						<Markup
							text={curTextValue ? curTextValue : ''}
							format={format}
							emojiSettings={emojiSettings}
						/>
					</div>
				</Tabs.Tab>
			</Tabs>
		</div>
	)
}

RichTextArea.propTypes = {
	textName: PropTypes.string.isRequired,
	textValue: PropTypes.string,
	formatName: PropTypes.string,
	htmlId: PropTypes.string,
	formatValue: PropTypes.string,
	maxLength: PropTypes.number,
	label: PropTypes.string.isRequired,
	placeholder: PropTypes.string,
	emojiSettings: emojiSettingsShape,
	characterCount: PropTypes.bool,
	hideEmojis: PropTypes.bool,
	required: PropTypes.bool,
	upload: PropTypes.bool,
	maxImages: PropTypes.number,
	files: fileShape,
}

RichTextArea.defaultProps = {
	formatValue: 'markdown',
	maxLength: constants.max.post,
	characterCount: false,
	hideEmojis: false,
	required: false,
	upload: false,
	maxImages: constants.max.imagesPost,
	files: [],
}

export default RichTextArea;