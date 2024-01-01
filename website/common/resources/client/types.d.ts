declare module '@react-stately/utils' {
  function useControlledState<T>(
    value?: T,
    defaultValue?: T,
    onChange?: (val: T, ...args: any[]) => void
  ): [T, (val: T | ((prevState: T) => T), ...args: any[]) => void];
}

declare module 'mime-match' {
  function match(typeA: string, typeB: string): boolean;
  export = match;
}

interface Window {
  grecaptcha?: {
    ready: (callback: () => void) => void;
    execute: (siteKey: string, options: {action: string}) => Promise<string>;
  };
  bootstrapData: string;
  onYouTubeIframeAPIReady: () => void;
}

type WebKitPresentationMode = 'picture-in-picture' | 'inline' | 'fullscreen';
interface HTMLVideoElement {
  disablePictureInPicture: boolean;

  /**
   * A Boolean value indicating whether the video is displaying in fullscreen mode.
   *
   * @see {@link https://developer.apple.com/documentation/webkitjs/htmlvideoelement/1630493-webkitdisplayingfullscreen}
   */
  readonly webkitDisplayingFullscreen?: boolean;

  /**
   * A Boolean value indicating whether the video can be played in fullscreen mode.
   *
   * `true` if the device supports fullscreen mode; otherwise, `false`. This property is also
   * `false` if the metadata is `loaded` or the `loadedmetadata` event has not fired, and if
   * the files are audio-only.
   *
   * @see {@link https://developer.apple.com/documentation/webkitjs/htmlvideoelement/1628805-webkitsupportsfullscreen}
   */
  readonly webkitSupportsFullscreen?: boolean;

  /**
   * A Boolean value indicating whether wireless video playback is disabled.
   */
  readonly webkitWirelessVideoPlaybackDisabled?: boolean;

  /**
   * A property indicating the presentation mode.
   *
   * @see {@link https://developer.apple.com/documentation/webkitjs/htmlvideoelement/1631913-webkitpresentationmode}
   */
  readonly webkitPresentationMode?: WebKitPresentationMode;

  /**
   * Enters fullscreen mode.
   *
   * This method throws an exception if the element is not allowed to enter fullscreen—that is,
   * if `webkitSupportsFullscreen` is false.
   *
   * @see {@link https://developer.apple.com/documentation/webkitjs/htmlvideoelement/1633500-webkitenterfullscreen}
   */
  webkitEnterFullscreen?(): void;

  /**
   * Exits fullscreen mode.
   *
   * @see {@link https://developer.apple.com/documentation/webkitjs/htmlvideoelement/1629468-webkitexitfullscreen}
   */
  webkitExitFullscreen?(): void;

  /**
   * A Boolean value indicating whether the video can be played in presentation mode.
   *
   * `true` if the device supports presentation mode; otherwise, `false`. This property is also
   * `false` if the metadata is `loaded` or the `loadedmetadata` event has not fired, and if
   * the files are audio-only.
   *
   * @see {@link https://developer.apple.com/documentation/webkitjs/htmlvideoelement/1629816-webkitsupportspresentationmode}
   */
  webkitSupportsPresentationMode?(mode: WebKitPresentationMode): boolean;

  /**
   * Sets the presentation mode for video playback.
   *
   * @see {@link https://developer.apple.com/documentation/webkitjs/htmlvideoelement/1631224-webkitsetpresentationmode}
   */
  webkitSetPresentationMode?(mode: WebKitPresentationMode): Promise<void>;
}
