import { EORZEA_MONTHS_NAME_MAP } from './constant';

const EORZEA_TIME_FACTOR = 60 * 24 / 70;  // 艾欧泽亚一天（60*24=1440分钟）相当于现实时间70分钟

const EORZEA_MONTHS_PER_YEAR = 12;
const EORZEA_DAYS_PER_MONTH = 32;
const EORZEA_HOURS_PER_DAY = 24;
const EORZEA_MINUTES_PER_HOUR = 60;
const EORZEA_SECONDS_PER_MINUTE = 60;

const EORZEA_MS_PER_MINUTE = 60000;  // EORZEA_SECONDS_PER_MINUTE * 1000
const EORZEA_MS_PER_HOUR = 3600000; // EORZEA_MS_PER_MINUTE * EORZEA_MINUTES_PER_HOUR
const EORZEA_MS_PER_DAY = 86400000; // EORZEA_MS_PER_HOUR * EORZEA_HOURS_PER_DAY
const EORZEA_MS_PER_MONTH = 2764800000; // EORZEA_MS_PER_DAY * EORZEA_DAYS_PER_MONTH;



export class EorzeaTime {
    month: number = 0;
    day: number = 0;
    hour: number = 0;
    minute: number = 0;

    constructor();
    constructor(month: number);
    constructor(month: number, day: number, hour: number, minute: number);
    constructor(month?: number, day?: number, hour?: number, minute?: number) {
        if (month && day && hour && minute) {
            this.month = month;
            this.day = day;
            this.hour = hour;
            this.minute = minute;
        } else if (month) {
            // 此时month是LT时间戳
            return EorzeaTime.fromLocalTimestamp(month);
        } else {
            return EorzeaTime.fromLocalTimestamp(Date.now());
        }
    }

    static fromLocalTimestamp(timestamp: number) {
        const eorzeaTimestamp = timestamp * EORZEA_TIME_FACTOR;
        const month = Math.floor(eorzeaTimestamp / EORZEA_MS_PER_MONTH % EORZEA_MONTHS_PER_YEAR) + 1;
        const day = Math.floor(eorzeaTimestamp / EORZEA_MS_PER_DAY % EORZEA_DAYS_PER_MONTH) + 1;
        const hour = Math.floor(eorzeaTimestamp / EORZEA_MS_PER_HOUR % EORZEA_HOURS_PER_DAY);
        const minute = Math.floor(eorzeaTimestamp / EORZEA_MS_PER_MINUTE % EORZEA_MINUTES_PER_HOUR);
        return new EorzeaTime(month, day, hour, minute);
    }

    show(){
        console.log(`${this.month}月${this.day}日 ${this.hour}:${this.minute}`);
    }

    getMonthName() {
        return EORZEA_MONTHS_NAME_MAP[this.month];
    }
}