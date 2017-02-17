/* @flow */

import Kefir from 'kefir';
import fromEventTargetCapture from '../../../../lib/from-event-target-capture';

import type GmailComposeView from '../gmail-compose-view';

export default function(gmailComposeView: GmailComposeView): Kefir.Observable<Object> {

	var element = gmailComposeView.getElement();
	var sendButtonElement = gmailComposeView.getSendButton();
	var sendAndArchiveButtonElement = gmailComposeView.getSendAndArchiveButton();

	var domEventStream = Kefir.merge([
		fromEventTargetCapture(element, 'keydown')
			.filter(function(domEvent){
				return domEvent.ctrlKey || domEvent.metaKey;
			})
			.filter(function(domEvent){
				return domEvent.which === 13 || domEvent.keyCode === 13;
			}),

		fromEventTargetCapture(element, 'keydown')
			.filter(function(domEvent){
				return [13, 32].indexOf(domEvent.which) > -1 ||  [13, 32].indexOf(domEvent.keyCode) > -1;
			})
			.filter(function(domEvent){
				return (sendButtonElement && sendButtonElement.contains(domEvent.srcElement)) || (sendAndArchiveButtonElement && sendAndArchiveButtonElement.contains(domEvent.srcElement));
			}),

		fromEventTargetCapture(element, 'click')
			.filter(function(domEvent){
				return (sendButtonElement && sendButtonElement.contains(domEvent.srcElement)) || (sendAndArchiveButtonElement && sendAndArchiveButtonElement.contains(domEvent.srcElement));
			})
	]);

	return domEventStream.map(function(domEvent){
							return {
								eventName: 'presending',
								data: {
									cancel: function(){
										domEvent.preventDefault();
										domEvent.stopPropagation();
										domEvent.stopImmediatePropagation();
										gmailComposeView.sendCanceled();
									}
								}
							};
						});

}
