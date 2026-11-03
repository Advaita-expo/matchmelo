export const dateIdeas=[
  {id:'coffee',category:'Coffee',title:'A coffee. A little chemistry.',description:'Start with a relaxed café where you can hear each other and take your time.',query:'quiet cafes',tags:['An easy first date','Coffee & conversation'],icon:'coffee'},
  {id:'dinner',category:'Dinner',title:'A table for two.',description:'Find a casual restaurant, compare the menus, and pick a place you both feel good about.',query:'casual restaurants for a date',tags:['A little more time','Dinner together'],icon:'dinner'},
  {id:'dessert',category:'Dessert',title:'Something a little sweet.',description:'Ice cream, a bakery, or your shared favourite dessert makes a simple plan worth keeping.',query:'dessert cafes ice cream',tags:['Short & sweet','A small treat'],icon:'dessert'},
  {id:'walk',category:'A walk',title:'A little fresh air.',description:'Explore a public park or promenade together. Check the route and opening hours before you go.',query:'public parks promenades',tags:['Out in the open','A change of pace'],icon:'walk'},
];
export const demoDateOffers=[
  {id:'meal',code:'MELODATE10',title:'10% off a meal for two',description:'An example of a restaurant offer for your first date together.',terms:'Demo only. No participating restaurant has approved this offer. The code cannot be redeemed.',demo:true},
  {id:'drink',code:'MELODRINK',title:'One drink on the house',description:'An example of a complimentary non-alcoholic drink with a date-night meal.',terms:'Demo only. No venue has approved a free drink. Eligible drinks, purchase conditions, and expiry would be set by a participating venue.',demo:true},
];
export function mapsSearch(query,location){const url=new URL('https://www.google.com/maps/search/');url.searchParams.set('api','1');const place=String(location||'').trim().replace(/\s+/g,' ').slice(0,120);url.searchParams.set('query',[query,place?'near '+place:'near me'].filter(Boolean).join(' '));return url.href;}
