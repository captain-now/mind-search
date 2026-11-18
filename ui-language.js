/* Korean-only compatibility shim. No translation or language selection. */
window.mindSearchLanguage = (() => {
 const key='mindsearch-ui-language';
 const locales={ko:'ko-KR'};
 const labels={ko:'한국어'};
 const options=[['ko','🇰🇷 한국어']];
 function read(){return 'ko';}
 function write(code){return code==='ko';}
 function sourceText(translate){return (_node,_field,current)=>current;}
 document.documentElement.lang='ko';
 return {key,locales,labels,options,read,write,sourceText};
})();
