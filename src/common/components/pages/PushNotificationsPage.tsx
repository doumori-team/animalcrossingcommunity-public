import { Link } from 'react-router';

import { ContentBox } from '@layout';
import { routerUtils, constants } from '@utils';

export const action = routerUtils.formAction;

const PushNotificationsPage = () =>
{
	return (
		<div className='PushNotificationsPage'>
			<ContentBox>
				Follow these steps to get ACC notifications on your device!
				<ol>
					<li>Open the browser on your device and navigate to ACC.</li>

					<li>
						Add ACC to your Home Screen. The way to get to this option varies slightly depending on your browser. For example, for Chrome, you can access this open after clicking the three dots. For Safari, you will need to click the share button.
						<div>
							<img
								src={constants.allImages['push/step2chrome.png']}
								alt='Chrome Button'
							/>
							<img
								src={constants.allImages['push/step2safari.png']}
								alt='Safari Button'
							/>
							<img
								src={constants.allImages['push/step2add.png']}
								alt='Add to Home Page'
							/>
						</div>
					</li>

					<li>
						After you have added ACC to your Home Screen, open it the same as you would an app.
						<br />
						<img
							src={constants.allImages['push/step3.png']}
							alt='ACC App'
						/>
					</li>

					<li>
						Navigate to your <Link to='/settings/account'>account settings</Link> and click “Enable Push Notifications” button.
					</li>

					<li>
						You now have push notifications from ACC!
						<br />
						<img
							src={constants.allImages['push/step6.png']}
							alt='ACC Push Notification Example'
						/>
					</li>
				</ol>

				<br />

				<h2>FAQ</h2>

				<div>
					<h3>My device isn't getting notifications!</h3>
					<p>
						This can happen if you deleted the app and then reinstalled it. Go to{' '}
						<Link to='/settings/account'>account settings</Link> and click 'Enable Push Notifications' again.
					</p>
				</div>

				<div>
					<h3>I don't see 'Enable Push Notifications' button.</h3>
					<p>
						Not everything that can access ACC can do push notifications. On a mobile device, make sure you've added it properly as a Progressive Web App to your Home screen. Just accessing it via your browser won't work on iPhones.
					</p>
				</div>

				<div>
					<h3>I don't want to receive ACC notifications anymore! How do I turn it off?</h3>
					<p>
						Any device you've enabled it on has the ability to turn off notifications in its settings.
					</p>
				</div>

				<div>
					<h3>Can I have multiple devices getting push notifications?</h3>
					<p>
						Yes! If you are using ACC on your desktop, mobile notifications will wait, and after 10 minutes of no activity on desktop, they will go to your mobile instead. Every desktop / mobile device registered will receive notifications at the same time.
					</p>
				</div>
			</ContentBox>
		</div>
	);
};

export default PushNotificationsPage;
