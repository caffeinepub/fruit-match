import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface AudioFile {
    id: string;
    context: SoundContext;
    blob: ExternalBlob;
    description: string;
    world?: Theme;
}
export enum SoundContext {
    bossDefeat = "bossDefeat",
    worldUnlock = "worldUnlock",
    bomb = "bomb",
    clock = "clock",
    rewardClaim = "rewardClaim",
    bossObjective = "bossObjective",
    bossVictory = "bossVictory",
    layerOpen = "layerOpen",
    bossLevelStart = "bossLevelStart",
    tileMatch = "tileMatch",
    buttonClick = "buttonClick",
    backgroundMusic = "backgroundMusic",
    tileClear = "tileClear",
    tileClick = "tileClick",
    starEarned = "starEarned",
    shuffle = "shuffle",
    magnifier = "magnifier",
    levelComplete = "levelComplete"
}
export enum Theme {
    candyland = "candyland",
    ocean = "ocean",
    garden = "garden",
    space = "space",
    volcano = "volcano",
    forest = "forest"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addAudioFile(id: string, context: SoundContext, world: Theme | null, blob: ExternalBlob, description: string): Promise<void>;
    adminLogin(password: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteAudioFile(id: string): Promise<void>;
    getAllAudioFiles(): Promise<Array<AudioFile>>;
    getAudioFile(id: string): Promise<AudioFile>;
    getAudioFilesByContext(context: SoundContext): Promise<Array<AudioFile>>;
    getAudioFilesByWorld(world: Theme): Promise<Array<AudioFile>>;
    getCallerUserRole(): Promise<UserRole>;
    isCallerAdmin(): Promise<boolean>;
}
