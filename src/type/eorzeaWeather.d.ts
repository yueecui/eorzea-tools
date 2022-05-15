declare class EorzeaWeather {
    mapName: string;
    constructor(mapName: string);
    /** 获取用于生产天气预报列表的地图组信息 */
    static getMapGroups(): MapGroup[];
    /** 获得所有有效的地图名字 */
    static getValidMaps(): string[];
    /** 根据天气名称获得天气图标ID */
    static getWeatherIconId(weatherName: string): number;
    /** 本地图有效的天气 */
    getValidWeathers(): string[];
    /** 获取指定时间附近的天气情况 */
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

/** 查找天气时的单个结果 */
interface WeatherResult {
    /** 本次请求中的序号，0为当前天气，负数为之前的，正数为之后，只用于findWeather() */
    index?: number;
    /** 天气ID */
    wid: number;
    /** 天气名称 */
    name: string;
    /** 天气图标 */
    icon: number;
    /** 天气开始的时间戳 */
    start: number;
}

/** 查询天气条件 */
interface findWeatherCondition {
    /** 目标天气 */
    target?: string | string[];
    /** 前置天气 */
    previous?: string | string[];
    /** 有效时间区间 */
    interval?: [boolean, boolean, boolean];
}

/** 天气查找结果 */
interface findWeatherResult {
    /** 目标天气信息 */
    target: WeatherResult | null;
    /** 前置天气信息 */
    previous: WeatherResult | null;
    /** 下一次查找使用的开始时间戳 */
    nextStarttime: number;
}

/** 地图组 */
interface MapGroup {
    /** 组名称 */
    name: string;
    /** 组图标ID，该ID为Wiki中[[File:Weather_area_X.png]]的X */
    icon: number;
    /** 区域信息组，一个地图组可以有多个区域 */
    zones: ZoneInfo[];
}

interface ZoneInfo {
    /** 区域名称 */
    name: string;
    /** 地图名称 */
    maps: string[];
}