import * as D2H from 'diff2html';
import 'diff2html/bundles/css/diff2html.min.css'

class Diff2Html {
  config: D2H.Diff2HtmlConfig
  constructor(){
    this.config = D2H.defaultDiff2HtmlConfig
    this.config.drawFileList = false
  }

  public Parse2Html(diffs:string){
    return D2H.html(diffs, this.config)
  }

  public setFormatType(type: 'line-by-line' | 'side-by-side'){
    this.config.outputFormat = type
  }

  public setConfig<T extends keyof D2H.Diff2HtmlConfig, K extends D2H.Diff2HtmlConfig[T]>(key: T , value: K){
    this.config[key] = value
  }
  
}

export default new Diff2Html()