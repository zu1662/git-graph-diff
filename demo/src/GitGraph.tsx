import axios from "axios";
import React from "react";
import GitGraphIns from '../../dist/index'
import '../../dist/style.css'
interface IProps { }

class GitGraph extends React.Component<IProps> {
  state = {
    gitRepos: 'D:/Electron Gui/KGUI',
    gitGraph: null
  }
  componentDidMount() {
    const tableElem = document.getElementById('commitTable')
    const footerElem = document.getElementById('footer')
    const viewElem = document.getElementById('viewBox')
    const gitGraph = new GitGraphIns({
      tableElem,
      footerElem,
      viewElem,
      commitClickCallback: async (commitHash:string, next:any) => {
        const result = await axios.get('/api/detail', {params: {hash:commitHash}})
        next(result.data.commitDetails)
      },
      fileDiffCallback: async (hash:string,filePath:string, next:any) => {
        const result = await axios.get('/api/diff', {params: {hash, file:filePath}})
        next(result.data)
      }
    })
    this.setState({
      gitGraph
    })
    axios.get('/api/commits').then(res => {
      const result = res.data
      gitGraph.moreCommitsAvailable = result.moreCommitsAvailable
      gitGraph.loadCommits(result.commits, result.head, result.tags, result.moreCommitsAvailable, false)
    })
  }

  render() {
    return (
      <div id="viewBox">
        <div id="content">
          <div id="commitGraph"></div>
          <div id="commitTable"></div>
        </div>
        <div id="footer"></div>
      </div>
    )
  }
}


export default GitGraph