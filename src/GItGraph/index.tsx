import axios from "axios";
import React from "react";
import { Graph } from './graph'
import * as GG from './type'
import './index.css'
import {UNCOMMITTED,arraysStrictlyEqual,arraysEqual} from './utils'

interface IProps {}

class GitGraph extends React.Component<IProps> {
  graph: Graph | null = null
  commitLookup:any = {}
  config = {
    graph: {
      colours: ['#0085d9', '#d9008f', '#00d90a', '#d98500', '#a300d9', '#ff0000', '#00d9cc', '#e138e8', '#85d900', '#dc5b23', '#6f24d6', '#ffcc00'],
      style: GG.GraphStyle.Angular,
      grid: { x: 16, y: 24, offsetX: 16, offsetY: 12, expandY: 250 },
      uncommittedChanges: GG.GraphUncommittedChangesStyle.OpenCircleAtTheCheckedOutCommit
    },
    mute: {
      commitsNotAncestorsOfHead: false,
      mergeCommits: true
    }
  }
  commits:any = []
  onlyFollowFirstParent = false
  state = {
    gitRepos: 'D:/Electron Gui/KGUI',
  }
  componentDidMount(){
    const viewElm = document.getElementById('viewBox')
    this.graph = new Graph('commitGraph', viewElm!, this.config.graph, this.config.mute);
    axios.get('/api/commits').then(res => {
      const result = res.data
      this.loadCommits(result.commits, result.head, result.tags, result.moreCommitsAvailable, false)
    })
  }

  loadCommits(commits: GG.GitCommit[], commitHead: string | null, tags: ReadonlyArray<string>, moreAvailable: boolean, onlyFollowFirstParent: boolean) {
    let commitLookup:any = {};
		let i: number, commit;
		for (i = 0; i <commits.length; i++) {
			commit = commits[i];
		  commitLookup[commit.hash] = i;
		}

		this.graph?.loadCommits(commits, commitHead, commitLookup, onlyFollowFirstParent);
    this.graph?.render(null);
	}
  

  render(){
    return (
      <div id="viewBox">
       <div id="content">
					<div id="commitGraph"></div>
					<div id="commitTable"></div>
				</div>
      </div>
    )
  } 
}


export default GitGraph