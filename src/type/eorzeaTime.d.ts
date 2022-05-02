declare class EorzeaTime {
    constructor(month: number, day: number, hour: number, minute: number);
    static fromLocalTimestamp(timestamp: number): EorzeaTime;
    /** 获取艾欧泽亚月份的游戏名称 */
    getMonthName(): string;
}

interface EorzeaGuardianDetail {
    name: string;
    gender: '男' | '女';
    element: string;
    power: string;
    shrine: string;
    month: string;
}

declare interface Window {
    EorzeaTime: typeof EorzeaTime;
}