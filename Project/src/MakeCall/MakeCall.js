import React from "react";
import { main } from '@azure/communication-calling';
import { setLogLevel, AzureLogger } from '@azure/logger';
import { utils } from "../Utils/Utils";
import AvatarCard from './AvatarCard';

async function init() {
    //window.avatarUser = await utils.teamsPopupLogin();
    //console.log('###', window.avatarUser);
    window.avatarUser = await utils.getCommunicationUserToken(undefined, false);
    window.token = window.avatarUser.communicationUserToken.token;
    window.cogSvcRegion = window.cogSvcRegion ?? 'westus2....';
    window.cogSvcSubKey = window.cogSvcSubKey ?? '.....'
    await main();
    return window.avatarUser;
}
export default class MakeCall extends React.Component {
    constructor(props) {
        super(props);

        // override logger to be able to dowload logs locally
        AzureLogger.log = (...args) => {
            if (args[0].startsWith('azure:ACS-calling:info')) {
                console.info(...args);
            } else if (args[0].startsWith('azure:ACS-calling:verbose')) {
                console.debug(...args);
            } else if (args[0].startsWith('azure:ACS-calling:warning')) {
                console.warn(...args);
            } else if (args[0].startsWith('azure:ACS-calling:error')) {
                console.error(...args);
            } else {
                console.log(...args);
            }
        };

        init().then(info => {
            this.setState({
                userId: info.userId.communicationUserId
            });
        }).catch(console.error);
        this.state = {
            userId: ''
        }

    }
    
    render() {
        return (
            <div>
                <div className="card">
                    <div className="ms-Grid">
                        <div className="ms-Grid-row">
                            <h2 className="ms-Grid-col ms-lg6 ms-sm6 mb-4">UserId: {this.state.userId}</h2>
                            <div className="ms-Grid-col ms-lg6 ms-sm6 text-right">
                            </div>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="ms-Grid">
                        <div className="ms-Grid-row">
                            <h3>Avatar speech</h3>
                        </div>
                        <div className="md-grid-row">
                            <AvatarCard />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
