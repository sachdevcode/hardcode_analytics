export interface YouTubeChannelStats {
    id: string;
    snippet?: {
        title?: string;
        customUrl?: string;
    };
    statistics?: {
        viewCount?: string;
        subscriberCount?: string;
        videoCount?: string;
        hiddenSubscriberCount?: boolean;
    };
}
export interface FetchedChannel {
    creatorId: string;
    displayName: string | null;
    handle: string;
    channelId: string;
    subscribers: number | null;
    viewsTotal: number | null;
    videoCount: number | null;
    avgViews30d: number | null;
    engagementRate: number | null;
    rawJson: string;
}
export declare function fetchChannelStats(apiKey: string, channelId: string, handle: string, category: string): Promise<FetchedChannel | null>;
export declare function getSeedChannels(): {
    channelId: string;
    handle: string;
    category: string;
}[];
export declare function runIngestion(apiKey: string): Promise<number>;
