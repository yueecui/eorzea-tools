import { EorzeaTime } from './eorzeaTime';
import data from './data/weatherData.json';

const WEATHER_DATA: Record<string, { n: string, i: number }> = data.weather;
const MAP_CONFIGURE: Record<string, number[]> = data.mapConfigure;
const FIND_LIMIT = 100000; // 单方向查找的上限（正向或是逆向）


export class EorzeaWeather {
    mapName: string;
    /** 100长度的数组，对应天气索引 */
    private _weahterMap: number[];
    /**
     * 天气缓存，防止反复计算
     * @key timestamp 起始的时间戳
     * @value weathers 天气id的数组，注意0是起始时间戳的前一个天气，1是当前天气，2开始是下一个天气
     */
    private _weatherCache: Record<number, {
        c: number,  // 当前天气
        p: number[], // 未来天气序列（0是下一个）
        n: number[], // 过去天气序列（最后一个是上一个，0是目前查找的最远的），即使用unshift()添加
    }>;

    constructor(mapName: string) {
        if (!MAP_CONFIGURE[mapName]) {
            throw new Error(`地图 ${mapName} 不支持，请检查数据`);
        }
        this.mapName = mapName;
        this._weahterMap = this._generateWeatherMap();
        this._weatherCache = {};
    }

    private _generateWeatherMap() {
        const mapConf = MAP_CONFIGURE[this.mapName];
        if (mapConf.length % 2 !== 0) throw new Error(`地图 ${this.mapName} 数据不正确，配置数量不是2的倍数，请检查数据`);
        let weatherMap: number[] = [];
        for (let i = 0; i < mapConf.length; i += 2) {
            weatherMap = weatherMap.concat(Array(mapConf[i + 1]).fill(mapConf[i]));
        }
        if (weatherMap.length !== 100) throw new Error(`地图 ${this.mapName} 数据不正确，总几率不是100，请检查数据`);
        return weatherMap;
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
        return this._getWeathers(starttime, positiveAmount, negativeAmount);
    }

    /** 罗列天气内部实现，会对结果进行缓存 */
    private _getWeathers(timestamp: number, positiveAmount: number, negativeAmount?: number) {
        const currentTime = new EorzeaTime(timestamp).getIntervalStartEorzeaTime();
        timestamp = currentTime.timestamp; // 更新到时间段起始点

        if (!this._weatherCache[timestamp]) {
            this._weatherCache[timestamp] = {
                c: 0,
                p: [],
                n: [],
            };
        }
        const cache = this._weatherCache[timestamp];
        positiveAmount = positiveAmount > FIND_LIMIT ? FIND_LIMIT : positiveAmount;
        negativeAmount = negativeAmount == undefined ? 0 : negativeAmount;
        negativeAmount = negativeAmount < -FIND_LIMIT ? -FIND_LIMIT : negativeAmount;

        // 当前天气
        if (cache.c == 0) {
            cache.c = this._weahterMap[currentTime.getWeatherValue()];
        }

        // 未来方向0是下一个天气
        while (cache.p.length < positiveAmount) {
            this._getNextWeather(timestamp);
        }
        // 过去方向-1是上一个天气，最大值是目前查找的最大值
        while (cache.n.length < negativeAmount) {
            this._getPrevWeather(timestamp);
        }

        // 拼合返回结果，必定包括当前天气
        const weathers: WeatherResult[] = [];
        for (let i = negativeAmount; i > 0; i--) {
            const wid = cache.n[cache.n.length - i];
            weathers.push({
                index: -i,
                wid,
                name: WEATHER_DATA[wid].n,
                icon: WEATHER_DATA[wid].i,
                start: currentTime.getIntervalStartEorzeaTime(-i).timestamp
            });
        }
        {
            const wid = cache.c;
            weathers.push({
                index: 0,
                wid,
                name: WEATHER_DATA[wid].n,
                icon: WEATHER_DATA[wid].i,
                start: currentTime.timestamp
            })
        }
        for (let i = 1; i <= positiveAmount; i++) {
            const wid = cache.p[i - 1];
            weathers.push({
                index: i,
                wid,
                name: WEATHER_DATA[wid].n,
                icon: WEATHER_DATA[wid].i,
                start: currentTime.getIntervalStartEorzeaTime(i).timestamp
            });
        }
        return weathers;
    }

    /** 获取当前时间戳缓存未来方向的下一个天气 */
    private _getNextWeather(timestamp: number) {
        if (this._weatherCache[timestamp].p.length >= FIND_LIMIT) {
            console.log(`该时间戳的未来天气已经查找到最大值`);
            return;
        }

        const temp = new EorzeaTime(timestamp).getIntervalStartEorzeaTime(this._weatherCache[timestamp].p.length + 1);
        const next = this._weahterMap[temp.getWeatherValue()];
        this._weatherCache[timestamp].p.push(next);
        return next;
    }

    /** 获取当前时间戳缓存过去方向的下一个天气 */
    private _getPrevWeather(timestamp: number) {
        if (this._weatherCache[timestamp].n.length >= FIND_LIMIT) {
            console.log(`该时间戳的过去天气已经查找到最大值`);
            return;
        }

        const temp = new EorzeaTime(timestamp).getIntervalStartEorzeaTime(-(this._weatherCache[timestamp].n.length + 1));
        const prev = this._weahterMap[temp.getWeatherValue()];
        this._weatherCache[timestamp].n.unshift(prev);
        return prev;
    }
}