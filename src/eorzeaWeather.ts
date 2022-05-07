import { EorzeaTime } from './eorzeaTime';
import data from './data/weatherData.json';

const WEATHER_DATA: Record<string, { n: string, i: number }> = data.weather;
const MAP_CONFIGURE: Record<string, number[]> = data.mapConfigure;
const FIND_LIMIT = 100000; // 单方向查找的上限（正向或是逆向）


export class EorzeaWeather {
    mapName: string;
    /** 100长度的数组，对应天气索引 */
    private _weahterMap: number[];
    /** 本地图有效的天气列表 */
    validWeathers: string[];


    constructor(mapName: string) {
        if (!MAP_CONFIGURE[mapName]) {
            throw new Error(`地图 ${mapName} 不支持，请检查数据`);
        }
        this.mapName = mapName;
        [this._weahterMap, this.validWeathers] = this._generateWeatherMap();
    }

    private _generateWeatherMap(): [number[], string[]] {
        const mapConf = MAP_CONFIGURE[this.mapName];
        if (mapConf.length % 2 !== 0) throw new Error(`地图 ${this.mapName} 数据不正确，配置数量不是2的倍数，请检查数据`);
        let weatherMap: number[] = [];
        const validWeathers: string[] = [];
        for (let i = 0; i < mapConf.length; i += 2) {
            weatherMap = weatherMap.concat(Array(mapConf[i + 1]).fill(mapConf[i]));
            if (!validWeathers.includes(WEATHER_DATA[mapConf[i]].n)) {
                validWeathers.push(WEATHER_DATA[mapConf[i]].n);
            }
        }
        if (weatherMap.length !== 100) throw new Error(`地图 ${this.mapName} 数据不正确，总几率不是100，请检查数据`);
        return [weatherMap, validWeathers];
    }

    getValidWeathers() {
        return this.validWeathers;
    }

    getWeathers(amount?: number | [number, number], starttime?: EorzeaTime | number): WeatherResult[] {
        if (starttime == undefined) {
            starttime = Date.now();
        } else if (typeof (starttime) === 'object') {
            starttime = starttime.timestamp;
        }

        let positiveAmount = 0;
        let negativeAmount = 0;
        if (typeof (amount) === 'object') {
            negativeAmount = Math.abs(amount[0]);
            positiveAmount = Math.abs(amount[1]);
        } else if (typeof (amount) === 'number') {
            if (amount > 0) {
                positiveAmount = amount;
            } else {
                negativeAmount = -amount;
            }
        }
        return this._getWeathers(negativeAmount, positiveAmount, starttime);
    }

    private _generateWeatherResult(weather_index: number, starttime: number, index?: number): WeatherResult {
        const wid = this._weahterMap[weather_index];
        if (index == undefined) {
            return {
                wid,
                name: WEATHER_DATA[wid].n,
                icon: WEATHER_DATA[wid].i,
                start: starttime
            }
        } else {
            return {
                index: index,
                wid,
                name: WEATHER_DATA[wid].n,
                icon: WEATHER_DATA[wid].i,
                start: starttime
            }
        }
    }

    /** 罗列天气内部实现，会对结果进行缓存 */
    private _getWeathers(negativeAmount: number, positiveAmount: number, timestamp: number) {
        const baseTime = new EorzeaTime(timestamp).getIntervalStartEorzeaTime();
        positiveAmount = positiveAmount > FIND_LIMIT ? FIND_LIMIT : positiveAmount;
        negativeAmount = negativeAmount == undefined ? 0 : negativeAmount;
        negativeAmount = negativeAmount < -FIND_LIMIT ? -FIND_LIMIT : negativeAmount;

        const result: WeatherResult[] = [];

        // 从负项开始查找
        for (let i = negativeAmount; i > 0; i--) {
            const currentTime = baseTime.getIntervalStartEorzeaTime(-i);
            result.push(this._generateWeatherResult(currentTime.getWeatherValue(), currentTime.timestamp, -i));
        }

        // 从正项开始查找（包括自己0）
        for (let i = 0; i <= positiveAmount; i++) {
            const currentTime = baseTime.getIntervalStartEorzeaTime(i);
            result.push(this._generateWeatherResult(currentTime.getWeatherValue(), currentTime.timestamp, i));
        }
        return result;
    }

    /** 查找符合条件的天气 */
    findWeather(condition: findWeatherCondition, starttime?: EorzeaTime | number): findWeatherResult {
        if (starttime == undefined) {
            starttime = Date.now();
        } else if (typeof (starttime) === 'object') {
            starttime = starttime.timestamp;
        }
        // 检查各个条件是否合法
        // 目标
        if (typeof (condition.target) == 'string') {
            condition.target = [condition.target];
        }
        condition.target = condition.target.filter(t => this.validWeathers.includes(t));
        // 全包含等于全不包含
        if (condition.target.length == this.validWeathers.length) {
            condition.target = [];
        }
        // 前置
        if (condition.previous == undefined) {
            condition.previous = [];
        } else if (typeof (condition.previous) == 'string') {
            condition.previous = [condition.previous];
        }
        condition.previous = condition.previous.filter(t => this.validWeathers.includes(t));
        // 全包含等于全不包含
        if (condition.previous.length == this.validWeathers.length) {
            condition.previous = [];
        }
        // 时段
        if (condition.interval == undefined) {
            condition.interval = [true, true, true];
        } else if (condition.interval[0] == false && condition.interval[1] == false && condition.interval[2] == false) {
            condition.interval = [true, true, true];
        }

        return this._findWeather(condition, starttime);
    }

    /** 查找天气的内部实现 */
    private _findWeather(condition: findWeatherCondition, timestamp: number): findWeatherResult {
        console.log(timestamp);
        if (condition.previous == undefined) {
            condition.previous = [];
        }
        // 如果没有目标，也没有前置，则返回空
        if (condition.target.length == 0 && condition.previous.length == 0) {
            return {
                target: null,
                previous: null,
                nextStarttime: -1,
            }
        }

        const baseTime = new EorzeaTime(timestamp).getIntervalStartEorzeaTime();

        /** 是否没有前置条件 */
        const hasPrevious = condition.previous.length > 0;
        /** 是否没有目标条件 */
        const hasTarget = condition.previous.length > 0;
        /** 上一个天气记录用 */
        let previousWeatherResult: WeatherResult = this._generateWeatherResult(baseTime.getWeatherValue(), baseTime.timestamp);
        let previousValid: boolean = condition.previous.includes(previousWeatherResult.name);

        // 分成以下几种情况
        // 没前置，没目标：已经pass了
        // 有前置，没目标
        // 没前置，有目标
        // 有前置，有目标
        for (let i = 1; i <= FIND_LIMIT; i++) {
            const currentTime = baseTime.getIntervalStartEorzeaTime(i);
            const currentWeatherResult = this._generateWeatherResult(currentTime.getWeatherValue(), currentTime.timestamp);
            // 如果不在可用时间段，就跳过
            if (!condition.interval![currentTime.getDayIntervalIndex()]) continue;
            let found = false;
            if (hasPrevious && hasTarget) {
                found = previousValid && condition.target.includes(currentWeatherResult.name);
            } else if (hasPrevious) {
                found = previousValid;
            } else if (hasTarget) {
                found = condition.target.includes(currentWeatherResult.name);
            } else {
                // 不应该出现的情况
                break;
            }

            if (found) {
                return {
                    target: currentWeatherResult,
                    previous: previousWeatherResult,
                    nextStarttime: currentTime.timestamp,
                }
            } else {
                previousWeatherResult = currentWeatherResult;
                if (hasPrevious) {
                    previousValid = condition.previous.includes(previousWeatherResult.name);
                }
            }
        }

        return {
            target: null,
            previous: null,
            nextStarttime: -2
        }
    }
}