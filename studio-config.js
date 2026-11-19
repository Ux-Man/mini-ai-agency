export const teams=[
 {name:'Strategy',color:'#36a6a0',members:[0,5]},
 {name:'Experience',color:'#4c8dd1',members:[1,2]},
 {name:'Product design',color:'#df9970',members:[3,4]},
 {name:'Content',color:'#be789f',members:[6,7]},
 {name:'Growth',color:'#87a65b',members:[8,9]},
 {name:'Visual studio',color:'#d7ad46',members:[10,11]},
 {name:'Spatial studio',color:'#7497a9',members:[12,13]},
 {name:'Engineering',color:'#8c83bd',members:[14,15]},
 {name:'Quality & data',color:'#d47c78',members:[16,17]}
];
export const teamFor=index=>teams.find(team=>team.members.includes(index));
export const meetingRoles=new Map([[0,{x:5.2,z:-3.52,rotation:Math.PI}],[1,{x:6.3,z:-5.58,rotation:0}],[5,{x:7.4,z:-5.58,rotation:0}]]);
export const walkingRoles=[7,15];
export const activityFor=index=>meetingRoles.has(index)?'In meeting':walkingRoles.includes(index)?'Walking':'At desk';
