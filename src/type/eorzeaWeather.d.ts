declare class EorzeaWeather {
    mapName: string;
    constructor(mapName: string);
    /** 获取指定时间时的天气情况 */
    getWeathers(amount?: number | [number, number], starttime?: EorzeaTime | number): WeatherResult[];
    findWeather(condition: findWeatherCondition, starttime?: EorzeaTime | number): findWeatherResult;
}

/** 查找天气时的单个区间结果 */
interface WeatherResult {
    /** 本次请求中的序号，0为当前天气，负数为之前的，正数为之后 */
    index?: number;
    wid: number;
    name: string;
    icon: number;
    start: number;
}

interface findWeatherCondition {
    target: string | string[];
    previous?: string | string[];
    interval?: [boolean, boolean, boolean];
}

interface findWeatherResult {
    target: WeatherResult | null;
    previous: WeatherResult | null;
    nextStarttime: number;
}