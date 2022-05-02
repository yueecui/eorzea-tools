import { EorzeaTime } from "./eorzeaTime";

window.EorzeaTime = EorzeaTime;

const test1 = new EorzeaTime();
console.log('test1');
test1.show();

const test2 = new EorzeaTime(1, 2, 3, 4);
console.log('test2');
test2.show();

const test3 = EorzeaTime.fromLocalTimestamp(Date.now());
console.log('test3');
test3.show();

const test4 = new EorzeaTime(Date.now());
console.log('test4');
test4.show();
