import { EORZEA_MONTHS_NAME_MAP } from './eorzeaTimeData';

const EORZEA_MONTHS_PER_YEAR = 12;
const EORZEA_DAYS_PER_MONTH = 32;
const EORZEA_HOURS_PER_DAY = 24;
const EORZEA_MINUTES_PER_HOUR = 60;

const EORZEA_HOUR_EQUAL_MILESECONDS = 175 * 1000;  // 艾欧泽亚1小时，相当于现实175秒 70*60/24=175
const EORZEA_MINUTE_EQUAL_MILESECONDS = EORZEA_HOUR_EQUAL_MILESECONDS / EORZEA_MINUTES_PER_HOUR;
const EORZEA_DAY_EQUAL_MILESECONDS = EORZEA_HOUR_EQUAL_MILESECONDS * EORZEA_HOURS_PER_DAY;
const EORZEA_MONTH_EQUAL_MILESECONDS = EORZEA_DAY_EQUAL_MILESECONDS * EORZEA_DAYS_PER_MONTH;
const EORZEA_YEAR_EQUAL_MILESECONDS = EORZEA_MONTH_EQUAL_MILESECONDS * EORZEA_MONTHS_PER_YEAR;


export class EorzeaTime {
    timestamp: number = 0;
    year: number = 0;
    month: number = 0;
    day: number = 0;
    hour: number = 0;
    minute: number = 0;

    constructor(timestamp?: number) {
        this.updateTimestamp(timestamp ? timestamp : Date.now());
    }

    static fromEorzeaTime(year: number, month: number, day: number, hour: number, minute: number) {
        if (month < 1 || month > EORZEA_MONTHS_PER_YEAR) {
            throw new Error(`month must be between 1 and ${EORZEA_MONTHS_PER_YEAR}`);
        }
        if (day < 1 || day > EORZEA_DAYS_PER_MONTH) {
            throw new Error(`day must be between 1 and ${EORZEA_DAYS_PER_MONTH}`);
        }
        if (hour < 0 || hour >= EORZEA_HOURS_PER_DAY) {
            throw new Error(`hour must be between 0 and ${EORZEA_HOURS_PER_DAY}`);
        }
        if (minute < 0 || minute >= EORZEA_MINUTES_PER_HOUR) {
            throw new Error(`minute must be between 0 and ${EORZEA_MINUTES_PER_HOUR}`);
        }

        const timestamp = EORZEA_YEAR_EQUAL_MILESECONDS * year
            + EORZEA_MONTH_EQUAL_MILESECONDS * (month - 1)
            + EORZEA_DAY_EQUAL_MILESECONDS * (day - 1)
            + EORZEA_HOUR_EQUAL_MILESECONDS * hour
            + EORZEA_MINUTE_EQUAL_MILESECONDS * minute;
        return new EorzeaTime(timestamp);
    }

    updateTimestamp(timestamp: number) {
        this.timestamp = timestamp;
        this.year = (this.timestamp / EORZEA_YEAR_EQUAL_MILESECONDS) >>> 0;
        this.month = ((this.timestamp / EORZEA_MONTH_EQUAL_MILESECONDS) >>> 0) % EORZEA_MONTHS_PER_YEAR + 1;
        this.day = ((this.timestamp / EORZEA_DAY_EQUAL_MILESECONDS) >>> 0) % EORZEA_DAYS_PER_MONTH + 1;
        this.hour = ((this.timestamp / EORZEA_HOUR_EQUAL_MILESECONDS) >>> 0) % EORZEA_HOURS_PER_DAY;
        this.minute = ((this.timestamp / EORZEA_MINUTE_EQUAL_MILESECONDS) >>> 0) % EORZEA_MINUTES_PER_HOUR;
    }

    /** 艾欧泽亚月份的游戏名称 */
    get monthName() {
        return EORZEA_MONTHS_NAME_MAP[this.month];
    }

    /** 获取当前时间的天气索引 */
    getWeatherValue() {
        const totalDays = Math.floor(this.timestamp / EORZEA_DAY_EQUAL_MILESECONDS);
        // 00:00~07:59 is 8
        // 08:00~15:59 is 16
        // 16:00~23:59 is 0        
        let value = totalDays * 100 + (this.getIntervalIndex() + 1) * 8 % 24;
        value = ((value << 11) ^ value) >>> 0;
        value = ((value >>> 8) ^ value) >>> 0;

        return value % 100;
    }

    /** 获取当前时间段序号（0~2） */
    getIntervalIndex() {
        return Math.floor(this.hour / 8);
    }

    /** 偏移当前对象若干个时间段 */
    offsetInterval(offset: number) {
        this.updateTimestamp(this.timestamp + (EORZEA_HOUR_EQUAL_MILESECONDS * 8 * offset));
    }

    /** 获取当前时间段开始的时间，可以额外指定偏移量 */
    getIntervalStartEorzeaTime(offset?: number){
        const eorzeaTime = EorzeaTime.fromEorzeaTime(this.year, this.month, this.day, this.getIntervalIndex() * 8, 0);
        eorzeaTime.offsetInterval(offset == undefined ? 0 : offset);
        return eorzeaTime;
    }

}