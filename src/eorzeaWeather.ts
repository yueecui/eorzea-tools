import { EorzeaTime } from './eorzeaTime';
import data from './data/data.json';
import config from './data/config.json';

const WEATHER_DATA: Record<string, { n: string, i: number }> = data.weathers;
const MAP_CONFIGURE: Record<string, number[]> = data.mapConfigure;
const MAP_GROUPS: MapGroup[] = data.mapGroups;
const SPECIAL_WEATHER_SET: Record<string, string[]> = config.special;
const FIND_LIMIT = 100000; // 单方向查找的上限

const RAINBOW_PREVIOUS_WEATHER = ['小雨', '暴雨', '雷雨'];
const RAINBOW_WEATHER_EXCEPTION = [...RAINBOW_PREVIOUS_WEATHER, '小雪', '暴雪', '薄雾'];


export class EorzeaWeather {
    mapName: string;
    /** 100长度的数组，对应天气索引 */
    private _weahterMap: number[];
    /** 本地图有效的天气列表 */
    private _validWeathers: string[];
    /** 本地图可以出现彩虹的天气 */
    private _rainbowWeathers: string[];

    constructor(mapName: string) {
        if (!MAP_CONFIGURE[mapName]) {
            throw new Error(`地图 ${mapName} 不支持，请检查数据`);
        }
        this.mapName = mapName;
        [this._weahterMap, this._validWeathers] = this._generateWeatherMap();
        this._rainbowWeathers = this._getRainbowWeather();
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

    static getMapGroups() {
        return MAP_GROUPS;
    }

    getValidWeathers() {
        return this._validWeathers;
    }

    static getValidMaps() {
        return Object.keys(MAP_CONFIGURE);
    }

    static getWeatherIconId(weatherName: string) {
        for (const weather of Object.values(WEATHER_DATA)) {
            if (weather.n === weatherName) {
                return weather.i;
            }
        }
        return -1;
    }

    getWeathers(amount?: number | [number, number], starttime?: EorzeaTime | number): WeatherResult[] {
        if (starttime == undefined) {
            starttime = Date.now();
        } else if (starttime instanceof EorzeaTime) {
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
        } else if (starttime instanceof EorzeaTime) {
            starttime = starttime.timestamp;
        }
        condition = JSON.parse(JSON.stringify(condition));
        // 检查各个条件是否合法
        // 目标
        if (condition.target == undefined) {
            condition.target = [];
        } else if (typeof (condition.target) == 'string') {
            condition.target = [condition.target];
        }
        condition.target = condition.target.filter(t => this._validWeathers.includes(t));
        // 全包含等于全不包含
        if (condition.target.length == this._validWeathers.length) {
            condition.target = [];
        }
        // 前置
        if (condition.previous == undefined) {
            condition.previous = [];
        } else if (typeof (condition.previous) == 'string') {
            condition.previous = [condition.previous];
        }
        condition.previous = condition.previous.filter(t => this._validWeathers.includes(t));
        // 全包含等于全不包含
        if (condition.previous.length == this._validWeathers.length) {
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
        if (condition.target == undefined) {
            condition.target == [];
        }
        if (condition.previous == undefined) {
            condition.previous = [];
        }
        // 如果没有目标，也没有前置，则返回空
        if (condition.target!.length == 0 && condition.previous.length == 0) {
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
        const hasTarget = condition.target!.length > 0;
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
                found = previousValid && condition.target!.includes(currentWeatherResult.name);
            } else if (hasPrevious) {
                found = previousValid;
            } else if (hasTarget) {
                found = condition.target!.includes(currentWeatherResult.name);
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

    /** 获取本地图可以出现彩虹的天气 */
    private _getRainbowWeather(): string[] {
        const rainbowWeathers = [];
        let hasRain = false;
        for (const weather of this._validWeathers) {
            if (RAINBOW_PREVIOUS_WEATHER.includes(weather)) {
                hasRain = true;
            } else if (!RAINBOW_WEATHER_EXCEPTION.includes(weather)) {
                rainbowWeathers.push(weather);
            }
        }

        if (hasRain && rainbowWeathers.length > 0) {
            return rainbowWeathers;
        } else {
            return [];
        }
    }

    // 获取本地图拥有的特殊天象列表
    static getValidSpecialWeathers(): string[] {
        return ['彩虹', ...Object.keys(SPECIAL_WEATHER_SET)];
    }    

    // 获取本地图拥有的特殊天象列表
    getAllSpecialWeatherTypes(): string[] {
        const specialWeathers = [];
        if (this._rainbowWeathers.length > 0) {
            specialWeathers.push('彩虹');
        }
        for (const weather of Object.keys(SPECIAL_WEATHER_SET)) {
            if (SPECIAL_WEATHER_SET[weather].includes(this.mapName)) {
                specialWeathers.push(weather);
            }
        }
        return specialWeathers;
    }

    // 查找特殊天象时间
    findSpecialWeather(weatherType: string, starttime?: EorzeaTime | number): findWeatherResult {
        if (starttime == undefined) {
            starttime = Date.now();
        } else if (starttime instanceof EorzeaTime) {
            starttime = starttime.timestamp;
        }
        const specialWeathers = this.getAllSpecialWeatherTypes();
        if (specialWeathers.includes(weatherType)) {
            switch (weatherType) {
                case '彩虹':
                    return this._findRainbow(starttime);
                case '钻石星辰':
                    return this._findDiamondStar(starttime);
                case '极光':
                    return this._findAurora(starttime);
                default:
                    console.error(`天气类型 ${weatherType} 不存在`);
            }
        } else {
            console.error(`地图 ${this.mapName} 没有特殊天象：${weatherType}`);
        }

        return {
            target: null,
            previous: null,
            nextStarttime: -1,
        }
    }

    // 判断是否为某个特殊天气
    isSpecialWeather(weatherType: string, timestamp?: EorzeaTime | number | findWeatherResult): boolean {
        if (timestamp == undefined) {
            timestamp = Date.now();
        } else if (timestamp instanceof EorzeaTime) {
            timestamp = timestamp.timestamp;
        }
        let findResult: findWeatherResult;
        if (typeof (timestamp) == 'number') {
            const weather = this.getWeathers(-1, timestamp);
            findResult = {
                target: weather[1],
                previous: weather[0],
                nextStarttime: weather[1].start,
            }
        } else {
            findResult = timestamp;
        }
        switch (weatherType) {
            case '彩虹':
                return this.isRainbow(findResult);
            case '钻石星辰':
                return this.isDiamondStar(findResult);
            case '极光':
                return this.isAurora(findResult);
            default:
                console.error(`天气类型 ${weatherType} 不存在`);
                return false;
        }
    }

    // 判断是否为彩虹天气
    isRainbow(findResult: findWeatherResult): boolean {
        if (findResult.target == null || findResult.previous == null || findResult.nextStarttime < 0) {
            return false;
        }
        if (this._rainbowWeathers.length == 0) {
            return false;
        }
        if (!RAINBOW_PREVIOUS_WEATHER.includes(findResult.previous.name)) {
            return false;
        }
        if (!this._rainbowWeathers.includes(findResult.target.name)) {
            return false;
        }
        const targetTime = new EorzeaTime(findResult.target.start);
        const day = targetTime.getDay();
        const interval = targetTime.getDayIntervalIndex();
        if ((day > 27 || day < 6) && interval > 0) {
            return true;
        } else if (day == 27 && interval == 2) {
            return true;
        } else if (day == 6 && interval == 1) {
            return true;
        }

        return false;
    }

    // 查找彩虹时间
    private _findRainbow(starttime: number): findWeatherResult {
        while (true) {
            const next = this._findWeather({
                target: this._rainbowWeathers,
                previous: RAINBOW_PREVIOUS_WEATHER,
                interval: [false, true, true],
            }, starttime)

            if (next.target == null) {
                console.error(`预料外的错误：找不到彩虹天气，地图：${this.mapName}`);
                return {
                    target: null,
                    previous: null,
                    nextStarttime: -3,
                };
            }

            if (this.isRainbow(next)) {
                return next;
            } else {
                starttime = next.nextStarttime;
            }
        }
    }

    // 判断是否为钻石星辰
    isDiamondStar(findResult: findWeatherResult): boolean {
        if (findResult.target == null || findResult.previous == null || findResult.nextStarttime < 0) {
            return false;
        }
        if (!SPECIAL_WEATHER_SET['钻石星辰'].includes(this.mapName)) {
            return false;
        }
        const targetTime = new EorzeaTime(findResult.target.start);
        if (findResult.target.name == '晴朗' && targetTime.getDayIntervalIndex() == 0) {
            return true;
        }
        if (findResult.target.name == '晴朗' && targetTime.getDayIntervalIndex() == 1 && findResult.previous.name != '晴朗') {
            return true;
        }
        return false;
    }

    // 查找钻石星辰时间
    private _findDiamondStar(starttime: number): findWeatherResult {
        while (true) {
            const next = this._findWeather({
                target: '晴朗',
                interval: [true, true, false],
            }, starttime)

            if (next.target == null) {
                console.error(`预料外的错误：找不到钻石星辰天气，地图：${this.mapName}`);
                return {
                    target: null,
                    previous: null,
                    nextStarttime: -4,
                };
            }

            if (this.isDiamondStar(next)) {
                return next;
            } else {
                starttime = next.nextStarttime;
            }
        }
    }

    // 判断是否为极光
    isAurora(findResult: findWeatherResult): boolean {
        if (findResult.target == null || findResult.previous == null || findResult.nextStarttime < 0) {
            return false;
        }
        if (!SPECIAL_WEATHER_SET['极光'].includes(this.mapName)) {
            return false;
        }
        const targetTime = new EorzeaTime(findResult.target.start);
        if (findResult.target.name == '碧空' && targetTime.getDayIntervalIndex() == 0) {
            return true;
        }
        return false;
    }

    // 查找极光时间
    private _findAurora(starttime: number): findWeatherResult {
        while (true) {
            const next = this._findWeather({
                target: '碧空',
                interval: [true, false, false],
            }, starttime)

            if (next.target == null) {
                console.error(`预料外的错误：找不到极光天气，地图：${this.mapName}`);
                return {
                    target: null,
                    previous: null,
                    nextStarttime: -5,
                };
            }

            if (this.isAurora(next)) {
                return next;
            } else {
                starttime = next.nextStarttime;
            }
        }
    }
}