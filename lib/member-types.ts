export type PublicProfile={id:string;name:string;age:number;city:string;area:string;intent:string;bio:string;interests:string[];reviewStatus:string;photos:Array<{id:string;position:number;url?:string}>};
export type MatchView={id:string;createdAt:string;profile:PublicProfile;lastMessage?:{text:string;created_at:string}|null};
export type MessageView={id:string;sender_id:string;text:string;created_at:string};
export type CallView={id:string;match_id:string;caller_id:string;recipient_id:string;status:string;expires_at:string;caller_name?:string};
