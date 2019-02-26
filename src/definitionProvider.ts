const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

class Definition{

    document:any;
    position:any;
    token:String;
    fileName:String;
    line:any;
    fileWorkDir:String;

    constructor(document:any, position:any, token:String) {
        
        this.document = document;
        this.position = position;
        this.token = token;
        this.fileName = document.fileName;
        this.fileWorkDir = path.dirname(document.fileName);
        this.line = document.lineAt(position);

        const p1 = this.handleClickActionToEffectOrReducers();
        if(p1) { return p1; }

        const p2 = this.handleClickRouteComponentToRealComponent();
        if(p2) { return p2;}

    }

    //处理点击路由组件的的时候跳转到真实的组件
    handleClickRouteComponentToRealComponent(){

        if(this.fileName.indexOf('config.js') > -1) {

            const text = this.line.text;
            if(text.indexOf("component") > -1 ) {

                const component = text.match(/.*?component.*?['|"](.*?)['|"]/);
                const componentRealPath = getComponentRealPath(component[1]);
                const reg = new RegExp("(.*?)\\s?class\\s","ig");
                const keywordPosition = this.getKeyWordPosition(reg, componentRealPath, 6);
                
                return new vscode.Location(vscode.Uri.file(componentRealPath), keywordPosition);
            }
        }


        function getComponentRealPath(component:String):String{

            const componentRealPath1 = `${vscode.workspace.rootPath}/src/page/${component}.js`;
            const componentRealPath2 = `${vscode.workspace.rootPath}/src/view/page/${component}.js`;
            
            if(fs.existsSync(componentRealPath1)) {return componentRealPath1;}
            if(fs.existsSync(componentRealPath2)) {return componentRealPath2;}
            return '';
        }

        return {};

    }

    //处理点击action的时候，跳转到model里面的对应的effect或者reducers
    handleClickActionToEffectOrReducers(){
        if(this.fileName.indexOf("/src/") > -1) {

            const headPosition = this.position.translate(-1, 0);
            const headLine = this.document.lineAt(headPosition);
            const text = headLine.text;

            if(text.indexOf("dispatch") > -1) {
                
                const action = this.line.text.match(/.+?['|"](.*?)['|"].*/)[1];
                const actionToArr = action.split('/');
                const modelFileName =  getModelRealPath(this,actionToArr[0]);
                const reg = new RegExp('(\\s*)(\\*?\\s*'+ actionToArr[1] +'\\()', 'gi');
                const keywordPosition = this.getKeyWordPosition(reg, modelFileName, 0);

                return new vscode.Location(vscode.Uri.file(modelFileName), keywordPosition);
            }

        }

        function getModelRealPath(context:any,modelFileName:String) {

            const modelFileName1 = `${vscode.workspace.rootPath}/src/model/${modelFileName}.js`;
            const modelFileName2 = `${vscode.workspace.rootPath}/src/view/model/${modelFileName}.js`;
            const modelFileName3 = `${context.fileWorkDir}/model/${modelFileName}.js`;
            
            if(fs.existsSync(modelFileName1)){
                
                return modelFileName1;
            }
        
            if(fs.existsSync(modelFileName2)){
        
                return modelFileName2;
            }

            if(fs.existsSync(modelFileName3)){

                return modelFileName3;
            }
        }

        return false;
        
    }

    /**
     * 
     * @param reg 关键词是一个正则
     * @param fileName 文件的名称
     */
    getKeyWordPosition(reg:Object, fileName:String|undefined, addCharacterLength:number):Object {

        const source = fs.readFileSync(fileName).toString().split('\n');
        let kCol = 0;
        let kLine  = 0;
        let isSearched = false;
        for(let i=0; i<source.length;i++) {
            const lineText = source[i];

            lineText.replace(reg, function($all:any, $1:String, $2:String){
                kCol = $1.length;
                kLine = i;
                isSearched = true;
            });

            if(isSearched){break;}
        }
        return new vscode.Position(kLine,kCol+addCharacterLength);
    }

}

function provideDefinition(document:any, position:any, token:any) {

    return new Definition(document, position, token);
}

module.exports = {
    provideDefinition
};