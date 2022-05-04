declare class EorzeaTime {
    timestamp: number;
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    constructor(timestamp: number);
    static fromEorzeaTime(year: number, month: number, day: number, hour: number, minute: number): EorzeaTime;
    updateTimestamp(timestamp: number): void;
    /** 艾欧泽亚月份的游戏名称 */
    monthName: string;
    /** 获取当前时间的天气索引 */
    getWeatherValue(): number;
    /** 获取当前时间段序号（0~2） */
    getIntervalIndex(): number;
    /** 偏移当前对象若干个时间段 */
    offsetInterval(offset: number): void;
    /** 获取当前时间段开始的时间，可以额外指定偏移量 */
    getIntervalStartEorzeaTime(offset?: number): EorzeaTime;
}

interface EorzeaGuardianDetail {
    name: string;
    gender: '男' | '女';
    element: string;
    power: string;
    shrine: string;
    month: string;
}

