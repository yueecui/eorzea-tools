declare class EorzeaWeather {
    mapName: string;
    constructor(mapName: string);
    /** 获取用于生产天气预报列表的地图组信息 */
    static getMapGroups(): MapGroup[];
    /** 获得所有有效的地图名字 */
    static getValidMaps(): string[];
    /** 本地图有效的天气 */
    getValidWeathers(): string[];
    /** 获取指定时间时的天气情况 */
    getWeathers(amount?: number | [number, number], starttime?: EorzeaTime | number): WeatherResult[];
    /** 查找一个天气 */
    findWeather(condition: findWeatherCondition, starttime?: EorzeaTime | number): findWeatherResult;

    /** 获取本地图拥有的特殊天象列表 */
    getAllSpecialWeatherTypes(): string[];
    /** 查找指定特殊天象 */
    findSpecialWeather(weatherType: string, starttime?: EorzeaTime | number): findWeatherResult;
    /** 判断一个搜索天气结果是否为彩虹 */
    isRainbow(findResult: findWeatherResult): boolean;
    /** 判断一个搜索天气结果是否为钻石星辰 */
    isDiamondStar(findResult: findWeatherResult): boolean;
    /** 判断一个搜索天气结果是否为极光 */
    isAurora(findResult: findWeatherResult): boolean;
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

/** 地图组 */
interface MapGroup {
    name: string;
    icon: number;
    zones: ZoneInfo[];
}

interface ZoneInfo {
    name: string;
    maps: string[];
}