import axios from "axios";
import React from "react";
import { Graph } from './graph'
import * as GG from './type'
import './base.css'
import './index.css'
import { UNCOMMITTED, SVG_ICONS, arraysStrictlyEqual, arraysEqual, formatShortDate, escapeHtml, abbrevCommit } from './utils'
import { TextFormatter } from "./textFormatter";

interface IProps { }

class GitGraph extends React.Component<IProps> {
  graph: Graph | null = null
  tableElem: HTMLElement | null = null
  footerElem: HTMLElement | null = null
  commitHead: string = ''
  commitLookup: any = {}
  gitBranchHead: string = 'master'
  renderedGitBranchHead: string = ''
  moreCommitsAvailable: boolean = false
  config = {
    graph: {
      colours: ['#0085d9', '#d9008f', '#00d90a', '#d98500', '#a300d9', '#ff0000', '#00d9cc', '#e138e8', '#85d900', '#dc5b23', '#6f24d6', '#ffcc00'],
      style: GG.GraphStyle.Rounded,
      grid: { x: 16, y: 24, offsetX: 16, offsetY: 45, expandY: 250 },
      uncommittedChanges: GG.GraphUncommittedChangesStyle.OpenCircleAtTheUncommittedChanges
    },
    mute: {
      commitsNotAncestorsOfHead: true,
      mergeCommits: true
    },
    defaultColumnVisibility: {
      author: true,
      commit: true,
      date: true
    },
    dateFormat: {
      type: GG.DateFormatType.DateAndTime,
      iso: true
    },
    referenceLabels: {
      branchLabelsAlignedToGraph: false,
      combineLocalAndRemoteBranchLabels: true,
      tagLabelsOnRight: true
    },
    markdown: false,
    fetchAvatars: false
  }
  commits: any = []
  onlyFollowFirstParent = false
  state = {
    gitRepos: 'D:/Electron Gui/KGUI',
  }
  componentDidMount() {
    this.tableElem = document.getElementById('commitTable')
    this.footerElem = document.getElementById('footer')
    const viewElm = document.getElementById('viewBox')
    this.graph = new Graph('commitGraph', viewElm!, this.config.graph, this.config.mute);
    axios.get('/api/commits').then(res => {
      const result = res.data
      this.moreCommitsAvailable = result.moreCommitsAvailable
      this.loadCommits(result.commits, result.head, result.tags, result.moreCommitsAvailable, false)
    })
  }

  loadCommits(commits: GG.GitCommit[], commitHead: string, tags: ReadonlyArray<string>, moreAvailable: boolean, onlyFollowFirstParent: boolean) {
    this.commits = commits
    this.commitHead = commitHead
    let commitLookup: any = {};
    let i: number, commit;
    for (i = 0; i < commits.length; i++) {
      commit = commits[i];
      commitLookup[commit.hash] = i;
    }

    this.graph?.loadCommits(commits, commitHead, commitLookup, onlyFollowFirstParent);
    this.graph?.render(null);
    this.renderTable();
  }

  renderTable() {
    const colVisibility = this.config.defaultColumnVisibility;
    const currentHash = this.commits.length > 0 && this.commits[0].hash === UNCOMMITTED ? UNCOMMITTED : this.commitHead;
    const vertexColours = this.graph?.getVertexColours() || [];
    const widthsAtVertices = this.config.referenceLabels.branchLabelsAlignedToGraph ? this.graph?.getWidthsAtVertices() : [];
    const mutedCommits = this.graph?.getMutedCommits(currentHash) || [];
    const textFormatter = new TextFormatter(this.commits, null, {
      emoji: true,
      issueLinking: true,
      markdown: this.config.markdown
    });

    let html = '<tr id="tableColHeaders"><th id="tableHeaderGraphCol" class="tableColHeader" data-col="0" width="80">Graph</th><th class="tableColHeader" data-col="1">Description</th>' +
      (colVisibility.date ? '<th class="tableColHeader dateCol" data-col="2">Date</th>' : '') +
      (colVisibility.author ? '<th class="tableColHeader authorCol" data-col="3">Author</th>' : '') +
      (colVisibility.commit ? '<th class="tableColHeader" data-col="4">Commit</th>' : '') +
      '</tr>';

    for (let i = 0; i < this.commits.length; i++) {
      let commit = this.commits[i];
      let message = '<span class="text">' + textFormatter.format(commit.message) + '</span>';
      let date = formatShortDate(commit.date);
      let branchLabels = this.getBranchLabels(commit.heads, commit.remotes);
      let refBranches = '', refTags = '', j, k, refName, remoteName, refActive, refHtml, branchCheckedOutAtCommit: string | null = null;

      for (j = 0; j < branchLabels.heads.length; j++) {
        refName = escapeHtml(branchLabels.heads[j].name);
        refActive = branchLabels.heads[j].name === this.gitBranchHead;
        refHtml = '<span class="gitRef head' + (refActive ? ' active' : '') + '" data-name="' + refName + '">' + SVG_ICONS.branch + '<span class="gitRefName" data-fullref="' + refName + '">' + refName + '</span>';
        for (k = 0; k < branchLabels.heads[j].remotes.length; k++) {
          remoteName = escapeHtml(branchLabels.heads[j].remotes[k]);
          refHtml += '<span class="gitRefHeadRemote" data-remote="' + remoteName + '" data-fullref="' + escapeHtml(branchLabels.heads[j].remotes[k] + '/' + branchLabels.heads[j].name) + '">' + remoteName + '</span>';
        }
        refHtml += '</span>';
        refBranches = refActive ? refHtml + refBranches : refBranches + refHtml;
        if (refActive) branchCheckedOutAtCommit = this.gitBranchHead;
      }
      for (j = 0; j < branchLabels.remotes.length; j++) {
        refName = escapeHtml(branchLabels.remotes[j].name);
        refBranches += '<span class="gitRef remote" data-name="' + refName + '" data-remote="' + (branchLabels.remotes[j].remote !== null ? escapeHtml(branchLabels.remotes[j].remote!) : '') + '">' + SVG_ICONS.branch + '<span class="gitRefName" data-fullref="' + refName + '">' + refName + '</span></span>';
      }

      for (j = 0; j < commit.tags.length; j++) {
        refName = escapeHtml(commit.tags[j].name);
        refTags += '<span class="gitRef tag" data-name="' + refName + '" data-tagtype="' + (commit.tags[j].annotated ? 'annotated' : 'lightweight') + '">' + SVG_ICONS.tag + '<span class="gitRefName" data-fullref="' + refName + '">' + refName + '</span></span>';
      }

      if (commit.stash !== null) {
        refName = escapeHtml(commit.stash.selector);
        refBranches = '<span class="gitRef stash" data-name="' + refName + '">' + SVG_ICONS.stash + '<span class="gitRefName" data-fullref="' + refName + '">' + escapeHtml(commit.stash.selector.substring(5)) + '</span></span>' + refBranches;
      }

      const commitDot = commit.hash === this.commitHead
        ? '<span class="commitHeadDot" title="' + (branchCheckedOutAtCommit !== null
          ? 'The branch ' + escapeHtml('"' + branchCheckedOutAtCommit + '"') + ' is currently checked out at this commit'
          : 'This commit is currently checked out'
        ) + '."></span>'
        : '';

      html += '<tr class="commit' + (commit.hash === currentHash ? ' current' : '') + (mutedCommits[i] ? ' mute' : '') + '"' + (commit.hash !== UNCOMMITTED ? '' : ' id="uncommittedChanges"') + ' data-id="' + i + '" data-color="' + vertexColours[i] + '">' +
        (this.config.referenceLabels.branchLabelsAlignedToGraph ? '<td>' + (refBranches !== '' ? '<span style="margin-left:' + (widthsAtVertices[i] - 4) + 'px"' + refBranches.substring(5) : '') + '</td><td><span class="description">' + commitDot : '<td></td><td><span class="description">' + commitDot + refBranches) + (this.config.referenceLabels.tagLabelsOnRight ? message + refTags : refTags + message) + '</span></td>' +
        (colVisibility.date ? '<td class="dateCol text" title="' + date.title + '">' + date.formatted + '</td>' : '') +
        (colVisibility.author ? '<td class="authorCol text" title="' + escapeHtml(commit.author + ' <' + commit.email + '>') + '">' + escapeHtml(commit.author) + '</td>' : '') +
        (colVisibility.commit ? '<td class="text" title="' + escapeHtml(commit.hash) + '">' + abbrevCommit(commit.hash) + '</td>' : '') +
        '</tr>';
    }
    this.tableElem.innerHTML = '<table>' + html + '</table>';
    this.footerElem.innerHTML = this.moreCommitsAvailable ? '<div id="loadMoreCommitsBtn" class="roundedBtn">Load More Commits</div>' : '';
    this.renderedGitBranchHead = this.gitBranchHead;

    if (this.moreCommitsAvailable) {
      document.getElementById('loadMoreCommitsBtn')!.addEventListener('click', () => {
        // this.loadMoreCommits();
      });
    }

  }


  getBranchLabels(heads: ReadonlyArray<string>, remotes: ReadonlyArray<GG.GitCommitRemote>) {
    let headLabels: { name: string; remotes: string[] }[] = [], headLookup: { [name: string]: number } = {}, remoteLabels: ReadonlyArray<GG.GitCommitRemote>;
    for (let i = 0; i < heads.length; i++) {
      headLabels.push({ name: heads[i], remotes: [] });
      headLookup[heads[i]] = i;
    }
    if (this.config.referenceLabels.combineLocalAndRemoteBranchLabels) {
      let remainingRemoteLabels = [];
      for (let i = 0; i < remotes.length; i++) {
        if (remotes[i].remote !== null) { // If the remote of the remote branch ref is known
          let branchName = remotes[i].name.substring(remotes[i].remote!.length + 1);
          if (typeof headLookup[branchName] === 'number') {
            headLabels[headLookup[branchName]].remotes.push(remotes[i].remote!);
            continue;
          }
        }
        remainingRemoteLabels.push(remotes[i]);
      }
      remoteLabels = remainingRemoteLabels;
    } else {
      remoteLabels = remotes;
    }
    return { heads: headLabels, remotes: remoteLabels };
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