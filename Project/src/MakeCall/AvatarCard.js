import React from "react";
import { ToastContainer, toast } from 'react-toastify';
import { Features } from '@azure/communication-calling';
import 'react-toastify/dist/ReactToastify.css';
import { PrimaryButton, TextField } from 'office-ui-fabric-react';
import { utils } from '../Utils/Utils';

const toastOptions = {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "colored",
};

function escapeXml(unsafe) {
    return unsafe.replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
}

export default class AvatarCard extends React.Component {
    constructor(props) {
        super(props);
		this.state = {
            inputMessage: ''
        }
        const call = props.call;
    }

    async sendMessage() {
        if (this.state.inputMessage) {
            try {
                if (window.avatarSynthesizer) {
                    const speech = escapeXml(this.state.inputMessage);
                    const spokenSsml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='http://www.w3.org/2001/mstts' xml:lang='en-US'><voice name='en-US-AvaMultilingualNeural'><mstts:ttsembedding speakerProfileId=''><mstts:leadingsilence-exact value='0'/>${speech}</mstts:ttsembedding></voice></speak>`;
                    await avatarSynthesizer.speakSsmlAsync(spokenSsml);
                    toast.info('Finished');
                } else {
                    throw new Error(`avatarSynthesizer is not available`);
                }
            } catch(e) {
                toast.error(`speak: ${e.message}`, toastOptions);
            }
        }
    }

    render() {
        return (
            <div className="ms-Grid">
                <div className="ms-Grid-row mb-6 mt-6">
                    <div>Speak</div>
                    <div className="ms-Grid-col ms-lg6 ms-sm6">
                        <TextField
                            label="message"
                            onKeyDown ={ev => {
                                if (ev.key === 'Enter') {
                                    this.sendMessage();
                                    ev.preventDefault();
                                }
                            }}
                            onChange={ev => {
                                this.setState({
                                    inputMessage: ev.target.value
                                });
                            }}
                            value={this.state.inputMessage}
                        />
                        <PrimaryButton
                            className="secondary-button"
                            iconProps={{ iconName: 'Send', style: { verticalAlign: 'middle', fontSize: 'large' } }}
                            text="Send"
                            onClick={() => this.sendMessage()}>
                        </PrimaryButton>
                    </div>
                </div>
            </div>
        );
   }
}
