import { json } from "stream/consumers";
import { EorzeaTime } from "./eorzeaTime";
import { EorzeaWeather } from "./eorzeaWeather";

if (typeof (window) != 'undefined') {
    window.EorzeaTime = EorzeaTime;
    window.EorzeaWeather = EorzeaWeather;
}

// const time = new EorzeaTime().getIntervalStartEorzeaTime();
// console.log(time.timestamp/(175 * 1000)/8);

// const timeA = new EorzeaTime();
// const timeB = new EorzeaTime().getIntervalStartEorzeaTime(-1);


// const zone = new EorzeaWeather('荣誉野');

// const result = zone.findWeather({
//     target: '晴朗',
//     interval: [true, true, false],
// });

// console.log(result);

// const result2= zone.findWeather({
//     target: '碧空',
//     previous: '晴朗',
// }, result.nextStarttime)

// console.log(result2);

// console.log('-3~10', zone.getWeathers([3, 10]));

// console.log('null', zone.getWeathers());

// console.log(-3, zone.getWeathers(-3));

// console.log(3, zone.getWeathers(3));
