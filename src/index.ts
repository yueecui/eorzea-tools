import { EorzeaTime } from "./eorzeaTime";
import { EorzeaWeather } from "./eorzeaWeather";

if (typeof (window) != 'undefined') {
    window.EorzeaTime = EorzeaTime;
    window.EorzeaWeather = EorzeaWeather;
}

const zone = new EorzeaWeather('拉诺西亚外地');

console.log('-3~10', zone.getWeathers([3, 10]));

console.log('null', zone.getWeathers());

console.log(-3, zone.getWeathers(-3));

console.log(3, zone.getWeathers(3));