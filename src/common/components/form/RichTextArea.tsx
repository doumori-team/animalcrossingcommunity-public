import React, { useState, useRef } from 'react';
import axios from 'axios';
import PhotoAlbum from 'react-photo-album';
import Compressor from 'compressorjs';

import * as markup from 'common/markup.ts';
import { RequireClientJS, RequirePermission } from '@behavior';
import MarkupButton from '@/components/form/MarkupButton.tsx';
import Select from '@/components/form/Select.tsx';
import { constants } from '@utils';
import EmojiButton from '@/components/form/EmojiButton.tsx';
import emojiDefs from 'common/markup/emoji.json' assert { type: 'json'};
import { EmojiSettingType, FileType, MarkupFormatType, FileInProcessType, ElementClickButtonType, MarkupStyleType } from '@types';
import { ErrorMessage, Tabs, PhotoSlideshow, PhotoGallery, Markup, FontAwesomeIcon } from '@layout';
import * as iso from 'common/iso.js';
import { UserContext } from '@contexts';
import Text from '@/components/form/Text.tsx';
import Form from '@/components/form/Form.tsx';
import Spinner from '@/components/form/Spinner.tsx';
import Button from '@/components/form/Button.tsx';

// Combined form control for rich text. Includes keyboard shortcuts for bold/italic/underline, etc
const RichTextArea = ({
	emojiSettings,
	formatValue = 'markdown',
	textValue,
	formatName,
	htmlId,
	maxLength = constants.max.post1,
	label,
	placeholder,
	characterCount = false,
	hideEmojis = false,
	textName,
	required = false,
	upload = false,
	maxImages = constants.max.imagesPost,
	files = [],
	previewSignature = false
}: RichTextAreaProps) =>
{
	const [format, setFormat] = useState<MarkupFormatType>(formatValue);
	const [curTextValue, setCurTextValue] = useState<string>(String(textValue || ''));
	const [errors, setErrors] = useState<string[]>([]);
	const [nodeFiles, setNodeFiles] = useState<FileType[]|FileInProcessType[]>(files);
	const [loading, setLoading] = useState<boolean>(false);
	const [fileIndex, setFileIndex] = useState<number>(-1);

	const textareaRef = useRef<any>(null);

	const onChangeText = () : void =>
	{
		setCurTextValue(textareaRef.current?.value);
	}

	const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) =>
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

	const getTagDetails = (type:string) : any|null =>
	{
		if (format === 'markdown')
		{
			return (markup.markdownTags as any)[type];
		}
		else if (format === 'markdown+html')
		{
			return (markup.markdownHtmlTags as any)[type];
		}
		else if (format === 'bbcode' || format === 'bbcode+html')
		{
			return (markup.traditionalTags as any)[type];
		}

		return null;
	}

	const getEmojiTagDetails = (type:string) : any|null =>
	{
		if (format === 'markdown' || format === 'markdown+html')
		{
			return (markup.markdownEmoji as any)[type];
		}
		else if (format === 'bbcode' || format === 'bbcode+html')
		{
			return (markup.traditionalEmoji as any)[type];
		}

		return null;
	}

	const doEmojiMarkup = (tag:string) : void =>
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

	const doQuickMarkup = (tag:any) : void =>
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

	const scanFile = async (e:any) : Promise<void> =>
	{
		setErrors([]);
		setLoading(true);

		const files:File[] = Array.from(e.target.files);

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

	const compressImage = async (file:File|Blob) : Promise<any> =>
	{
		return new Promise((resolve, reject) => {
			new Compressor(file, {
				convertSize: 1000000,
				success: resolve,
				error: reject,
			});
		});
	}

	const uploadImage = async (file:any) =>
	{
		let params = new FormData();
		params.append('imageExtension', file.type.replace(/(.*)\//g, ''));

		return await (iso as any).query(null, 'v1/users/upload_image', params)
			.then(async ({s3PresignedUrl, fileName}: {s3PresignedUrl: string, fileName: string}) =>
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
			.catch((error:any) =>
			{
				console.error('Error attempting to get presigned url.');
				console.error(error);

				setErrors(['bad-format']);
				setLoading(false);
			});
	}

	const removeFile = async (e:ElementClickButtonType, index:number) : Promise<void> =>
	{
		e.preventDefault();

		let newFiles = [...nodeFiles];
		newFiles.splice(index, 1);

		setNodeFiles(newFiles);
	}

	const getQuickMarkupButtons = () : React.ReactNode =>
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
							tag={getTagDetails('color')}
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
							tag={getTagDetails('quote')}
							clickHandler={doQuickMarkup.bind(this)}
							name='Quote' icon='quote-right'
						/>
						<MarkupButton
							tag={getTagDetails('line')}
							clickHandler={doQuickMarkup.bind(this)}
							name='Line' icon='lines'
						/>
						<MarkupButton
							tag={getTagDetails('usertag')}
							clickHandler={doQuickMarkup.bind(this)}
							name='User Tag' icon='usertag'
						/>
						<MarkupButton
							tag={getTagDetails('heading')}
							clickHandler={doQuickMarkup.bind(this)}
							name='Heading' icon='heading'
						/>
					</span>
					<span className='RichTextArea_quickMarkupGroup'>
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
						<MarkupButton
							tag={getTagDetails('center')}
							clickHandler={doQuickMarkup.bind(this)}
							name='Center' icon='center'
						/>
					</span>
					<span className='RichTextArea_quickMarkupGroup'>
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
									htmlFor='uploadImage'
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

	const getMarkupStyle = () : React.ReactNode =>
	{
		return (
			<div className='RichTextArea_markupStyle'>
				<Select
					name={formatName}
					label='Markup style'
					value={format}
					changeHandler={(event:any) => setFormat(event.target.value)}
					options={[
						{value: 'markdown', label: 'Markdown'},
						{value: 'bbcode', label: 'Traditional'},
						{value: 'plaintext', label: 'No Markup'},
					]}
				/>
			</div>
		)
	}

	const renderPhoto = ({photo, layoutOptions, imageProps: {alt, style, ...restImageProps}}: any) =>
	{
		const [caption, setCaption] = useState<string>(photo.description);

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
					onKeyDown={onKeyDown}
					onChange={onChangeText}
					data-lpignore='true'
					autoComplete='off'
					aria-label={label}
					placeholder={placeholder}
					required={required}
				/>
				{!hideEmojis && (
					<RequireClientJS>
						<div className='RichTextArea_emoji'>
							{Object.keys((emojiDefs as any)[0]).map((def, index) =>
								<EmojiButton
									key={index}
									tag={getEmojiTagDetails(def)}
									clickHandler={doEmojiMarkup.bind(this)}
									name={(emojiDefs as any)[0][def]}
									icon={(emojiDefs as any)[0][def]}
									type={def}
									emojiSettings={emojiSettings}
								/>
							)}
							<hr />
							{Object.keys((emojiDefs as any)[1]).map((def, index) =>
								<EmojiButton
									key={index}
									tag={getEmojiTagDetails(def)}
									clickHandler={doEmojiMarkup.bind(this)}
									name={(emojiDefs as any)[1][def]}
									icon={(emojiDefs as any)[1][def]}
									type={def}
									emojiSettings={emojiSettings}
								/>
							)}
						</div>
					</RequireClientJS>
				)}
			</div>
			{(characterCount && curTextValue != null) && (
				<RequireClientJS>
					(Character count: {curTextValue.length} / {maxLength} max)
				</RequireClientJS>
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

						{previewSignature && (
							<UserContext.Consumer>
								{currentUser => currentUser && (
									<>
									{nodeFiles.length > 0 && (
										currentUser.showImages ? (
											<PhotoGallery
												userId={currentUser.id}
												files={nodeFiles}
											/>
										) : (
											<>
											<Button
												type='button'
												label='View Image(s)'
												className='Node_link'
												clickHandler={() => setFileIndex(0)}
											/>

											<PhotoSlideshow
												userId={currentUser.id}
												files={nodeFiles}
												reportType={constants.userTicket.types.postImage}
												fileIndex={fileIndex}
												setFileIndex={setFileIndex}
												key={fileIndex}
											/>
											</>
										)
									)}

									{currentUser.signature && (
										<div className='Node_signature'>
											<Markup
												text={currentUser.signature}
												format={currentUser.signatureFormat}
												emojiSettings={emojiSettings}
											/>
										</div>
									)}
									</>
								)}
							</UserContext.Consumer>
						)}
					</div>
				</Tabs.Tab>
			</Tabs>
			{loading && (
				<Spinner />
			)}
			{nodeFiles.length > 0 && (
				<UserContext.Consumer>
					{currentUser => currentUser && (
						<PhotoAlbum
							layout='columns'
							photos={(nodeFiles as any).map((file: FileType, index:number) => {
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
		</div>
	)
}

type RichTextAreaProps = {
	textName: string // name to be assigned to the form control for the text itself
	textValue?: string | null // optional starting value for the text itself
	formatName?: string // name to be assigned to the form control for the markup type
	htmlId?: string // optional id parameter for accessibility with <label> elements
	formatValue?: MarkupFormatType | MarkupStyleType // optional starting value for format
	maxLength?: number
	label: string
	placeholder?: string
	emojiSettings?: EmojiSettingType[] // user emoji settings, for preview and gendered emojis
	characterCount?: boolean
	hideEmojis?: boolean
	required?: boolean
	upload?: boolean
	maxImages?: number
	files?: FileType[],
	previewSignature?: boolean
};

export default RichTextArea;