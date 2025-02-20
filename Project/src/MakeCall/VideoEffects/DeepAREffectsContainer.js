import React from 'react';
import { PrimaryButton, Dropdown } from 'office-ui-fabric-react';
import { Features } from '@azure/communication-calling';
import VideoEffectsImagePicker from './VideoEffectsImagePicker';
import * as deepar from 'deepar';

export const LoadingSpinner = () => {
    return (
        <div className='video-effects-loading-spinner'></div>
    )
};

export default class VideoEffectsContainer extends React.Component {
    constructor(props) {
        super(props);
        this.call = props.call;
        this.deepar = null;
        this.localVideoStream = props.stream;
        const canvas = document.createElement('canvas');
        const video = document.createElement('video');
        video.autoplay = true;
        this.videoResizeCallback = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        };
        video.addEventListener('resize', this.videoResizeCallback);
        this.canvas = canvas;
        this.video = video;
        this.initialized = false;
        this.initializationMessage = 'Initializing';
        this.videoEffects = [];
        this.bgImageLocation = '';
        this.state = {
            selectedVideoEffectIndex: -1,
            videoEffectsList: [],
            selectedVideoBgEffectIndex: -1,
            videoBgEffectsList: [],
            startEffectsLoading: false,
            stopEffectsLoading: false
        };
    }

    componentDidCatch(e) {
        this.logError(JSON.stringify(e));
    }

    componentDidMount() {
        this.initialize().then(() => {
            this.initializationMessage = '';
        }).catch(e => {
            this.initializationMessage = e.message || 'Not supported';
            this.logError(e);
        });
    }

    componentWillUnmount() {
        this.video.removeEventListener('resize', this.videoResizeCallback);
        if (this.deepar) {
            this.deepar.shutdown();
            this.deepar = null;
        }
    }

    logError(error) {
        this.setState({
            ...this.state,
        });

        console.error(error);
    }

    async initialize() {
        if (this.deepar) {
            throw new Error('DeepAR has been initialized.');
        }
        this.deepar = await deepar.initialize({
            licenseKey: '...',
            canvas: this.canvas,
            additionalOptions: {
                cameraConfig: {
                    disableDefaultCamera: true
                }
            }
        });

        this.videoBgEffects = [
            {
                name: 'Background blur',
                value: 'backgroundBlur'
            },
            {
                name: 'Background replacement',
                value: 'backgroundReplacement'
            }
        ];

        const videoBgEffectsList = this.videoBgEffects.map((item, index) => {
            return {
                key: index,
                text: item.name
            }
        });
        videoBgEffectsList.unshift({
            key: -1,
            text: 'No'
        });

        this.videoEffects = [
            {
                name: 'Aviators',
                value: 'https://cdn.jsdelivr.net/npm/deepar/effects/aviators'
            },
            {
                name: 'Lion',
                value: 'https://cdn.jsdelivr.net/npm/deepar/effects/lion'
            },
            {
                name: 'Dalmatian',
                value: 'https://cdn.jsdelivr.net/npm/deepar/effects/dalmatian'
            }
        ];

        const videoEffectsList = this.videoEffects.map((item, index) => {
            return {
                key: index,
                text: item.name
            }
        });

        videoEffectsList.unshift({
            key: -1,
            text: 'No'
        });

        this.setState({
            ...this.state,
            videoEffectsList,
            videoBgEffectsList
        });

        this.initialized = true;
    }

    async startEffects() {
        if (!this.initialized) {
            this.logError('Cannot start effects.');
            return;
        }
        if (this.originalStream) {
            this.logError('Cannot start effects. Already started.');
            return;
        }
        try {
            this.setState({
                ...this.state,
                startEffectsLoading: true
            });
            const localVideoStream = this.localVideoStream;
            this.originalStream = await localVideoStream.getMediaStream();
            this.originalSource = localVideoStream.source;
            this.originalStreamType = localVideoStream.mediaStreamType;
            this.video.srcObject = this.originalStream;
            this.deepar.setVideoElement(this.video, true);
            const mediaStream = this.canvas.captureStream(30);
            await localVideoStream.setMediaStream(mediaStream);
        } finally {
            this.setState({
                ...this.state,
                startEffectsLoading: false
            });
        }
    }

    async stopEffects() {
        if (!this.initialized || !this.originalStream) {
            return;
        }
        try {
            this.setState({
                ...this.state,
                stopEffectsLoading: true
            });
            this.deepar.stopVideo();
            if (this.originalStreamType === 'RawMedia') {
                await this.localVideoStream.setMediaStream(this.originalStream);
            } else {
                await this.localVideoStream.switchSource(this.originalSource);
            }
        } finally {
            this.originalStream = null;
            this.originalSource = null;
            this.originalStreamType = null;
            this.setState({
                ...this.state,
                stopEffectsLoading: false
            });
        }
    }

    async effectSelectionChanged(event, item) {
        const selectedItem = this.videoEffects[item.key];
        if (selectedItem) {
            this.setState({
                ...this.state,
                selectedVideoEffectIndex: item.key
            });
            await this.deepar.switchEffect(selectedItem.value);
        } else {
            await this.deepar.clearEffect();
        }
    }

    async bgEffectsSelectionChanged(event, item) {
        const selectedItem = this.videoBgEffects[item.key];
        if (selectedItem) {
            this.setState({
                ...this.state,
                selectedVideoBgEffectIndex: item.key
            });
            if (selectedItem.value === 'backgroundBlur') {
                await this.deepar.backgroundBlur(true, 5);
            } else if (selectedItem.value === 'backgroundReplacement') {
                if (this.bgImageLocation) {
                    await this.deepar.backgroundReplacement(true, this.bgImageLocation);
                }
            }
        } else {
            const prevItem = this.videoBgEffects[this.state.selectedVideoBgEffectIndex];
            this.setState({
                ...this.state,
                selectedVideoBgEffectIndex: item.key
            });
            if (prevItem) {
                if (prevItem.value === 'backgroundBlur') {
                    await this.deepar.backgroundBlur(false);
                } else if (prevItem.value === 'backgroundReplacement') {
                    if (this.bgImageLocation) {
                        await this.deepar.backgroundReplacement(false, this.bgImageLocation);
                    }
                }
            }
        }
    }

    async handleImageClick(imageLocation) {
        const selectedItem = this.videoBgEffects[this.state.selectedVideoBgEffectIndex];
        if (selectedItem && selectedItem.value === 'backgroundReplacement') {
            await this.deepar.backgroundReplacement(true, imageLocation);
            this.bgImageLocation = imageLocation;
            await this.state.selectedVideoEffect.configure({
                backgroundImageUrl: imageLocation
            });
        }
    }

    render() {
        return (
            <div>
                <h4>DeepAR effects</h4>
                {
                    this.videoEffects.length > 0 ?
                    <div>
                        <Dropdown
                            onChange={(e, item) => this.effectSelectionChanged(e, item).catch(console.error)}
                            options={this.state.videoEffectsList}
                            defaultSelectedKey={this.state.selectedVideoEffectIndex}
                            styles={{ dropdown: { width: 300, color: 'black' } }}
                        />
                        <Dropdown
                            onChange={(e, item) => this.bgEffectsSelectionChanged(e, item).catch(console.error)}
                            options={this.state.videoBgEffectsList}
                            defaultSelectedKey={this.state.selectedVideoBgEffectIndex}
                            styles={{ dropdown: { width: 300, color: 'black' } }}
                        />
                        <VideoEffectsImagePicker
                            disabled={this.videoBgEffects[this.state.selectedVideoBgEffectIndex]?.value !== 'backgroundReplacement'}
                            handleImageClick={(imageLocation) => this.handleImageClick(imageLocation).catch(
                                err => console.error(err)
                            )}
                        />
                        <PrimaryButton
                            className='secondary-button mt-2'
                            onClick={() => this.startEffects()}
                        >
                            {this.state.startEffectsLoading ? <LoadingSpinner /> : 'Start Effects'}
                        </PrimaryButton>
                        <PrimaryButton
                            className='secondary-button mt-2'
                            onClick={() => this.stopEffects()}
                        >
                            {this.state.stopEffectsLoading ? <LoadingSpinner /> : 'Stop Effects'}
                        </PrimaryButton>
                    </div>
                    :
                    <div>{this.initializationMessage}</div>
                }
            </div>
        );
    }
}
