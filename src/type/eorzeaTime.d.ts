declare class EorzeaTime {
    timestamp: number;
    constructor(timestamp: number);
    static fromEorzeaTime(year: number, month: number, day: number, hour: number, minute: number): EorzeaTime;
    static fromEpochIntervalIndex(index: number): EorzeaTime;
    getYear(): number;
    getMonth(): number;
    getMonthName(): string;
    getDay(): number;
    getHour(): number;
    getMinute(): number;
    /** 获取当前时间的天气索引 */
    getWeatherValue(): number;
    /** 获取当日当前时间段序号（0~2） */
    getDayIntervalIndex(): number;
    /** 获取整体游戏时段序号 */
    getEpochIntervalIndex(): number;
    /** 获取当前时间段开始的时间对象，可以额外指定偏移量 */
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

