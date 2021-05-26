import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Modal, Button, Row } from 'react-bootstrap'
import { parseLangName as Resolved } from '../../utilities/parser'
import { remote } from 'electron'
import React, { Component } from 'react'
import UserPanel from '../userPanel'
import {
  fetchSingleGist,
  selectGist,
  selectGistTag,
  updatePinnedTags,
  updatePinnedTagsModalStatus,
  updatescrollRequestStatus
} from '../../actions'

import plusIcon from './plus.svg'

import './index.scss'
import { AiOutlineSave } from 'react-icons/ai'
import { ImCancelCircle } from 'react-icons/im'

const conf = remote.getGlobal('conf')
const logger = remote.getGlobal('logger')

class NavigationPanel extends Component {
  constructor (props) {
    super(props)
    const { localPref, userSession } = this.props

    const userName = userSession.profile.login
    let activeSection = -1
    if (localPref && localPref.get(userName)) {
      const cachedActiveSession = localPref.get(userName).activeSection
      if (cachedActiveSession !== undefined) {
        activeSection = cachedActiveSession
      }
    }
    logger.debug(`-----> The tag activeSection is ${activeSection}`)

    this.state = {
      tmpPinnedTags: new Set(),
      activeSection,
    }
  }

  handleClicked (key) {
    const { selectGistTag, updateActiveGistAfterClicked, gists, gistTags } = this.props
    selectGistTag(key)
    updateActiveGistAfterClicked(gists, gistTags, key)
  }

  handleFileClicked (key) {
    const { gists, fetchSingleGist, selectGist } = this.props

    let gistId = ''
    Object.keys(gists).map(function (keyName, keyIndex) {
      const gist = gists[keyName]
      const filename = gist.brief.files[Object.keys(gist.brief.files)[0]].filename
      if (key === filename) {
        gistId = keyName
      }
    })
    logger.info('A new gist is selected: ' + gistId)
    if (!gists[gistId].details) {
      logger.info('[Dispatch] fetchSingleGist ' + gistId)
      fetchSingleGist(gists[gistId], gistId)
    }
    logger.info('[Dispatch] selectGist ' + gistId)
    selectGist(gistId)
  }

  renderPinnedTags () {
    const { pinnedTags, gistTags, activeGistTag } = this.props
    const pinnedTagList = []

    pinnedTags.forEach(tag => {
      if (gistTags[tag]) {
        pinnedTagList.push(
          <div key={ tag }>
            <a className={ tag === activeGistTag ? 'active-gist-tag' : 'gist-tag' }
              onClick={ this.handleClicked.bind(this, tag) }>
              #{ tag.startsWith('lang@') ? Resolved(tag) : tag }
            </a>
          </div>
        )
      }
    })

    return pinnedTagList
  } // renderPinnedTags

  renderPinnedFiles () {
    const { pinnedTags, gistTags, activeGistTag } = this.props
    const pinnedTagList = []

    pinnedTags.forEach(tag => {
      if (!gistTags[tag]) {
        pinnedTagList.push(
          <div key={ tag }>
            <a className={ tag === activeGistTag ? 'active-gist-tag' : 'gist-tag' }
              data-toggle="tooltip" title={tag}
              onClick={ this.handleFileClicked.bind(this, tag) }>
              { tag.startsWith('lang@') ? Resolved(tag) : tag }
            </a>
          </div>
        )
      }
    })

    return pinnedTagList
  } // renderPinnedFiles

  renderLangTags () {
    const { gistTags, activeGistTag } = this.props
    const langTagList = []

    Object.keys(gistTags)
      .filter(tag => {
        return tag.startsWith('lang@')
      })
      .sort()
      .forEach(prefixedLang => {
        langTagList.push(
          <div key={ prefixedLang }>
            <a className={ prefixedLang === activeGistTag ? 'active-gist-tag' : 'gist-tag' }
              onClick={ this.handleClicked.bind(this, prefixedLang) }>
              { '#' + Resolved(prefixedLang) }
            </a>
          </div>
        )
      })

    return langTagList
  } // renderLangTags()

  renderCustomTags () {
    const { gistTags, activeGistTag } = this.props
    const customTagList = []

    Object.keys(gistTags)
      .filter(tag => {
        return !tag.startsWith('lang@')
      })
      .sort()
      .forEach(prefixedLang => {
        customTagList.push(
          <div key={ prefixedLang }>
            <a className={ prefixedLang === activeGistTag ? 'active-gist-tag' : 'gist-tag' }
              onClick={ this.handleClicked.bind(this, prefixedLang) }>
              { '#' + Resolved(prefixedLang) }
            </a>
          </div>
        )
      })

    return customTagList
  }

  handleConfigurePinnedTagClicked () {
    const { updatePinnedTagsModalStatus, pinnedTags } = this.props

    this.setState({
      tmpPinnedTags: new Set(pinnedTags)
    })
    updatePinnedTagsModalStatus('ON')
  }

  handleSectionClick (index) {
    const { activeSection } = this.state
    const { localPref, userSession } = this.props

    const nextActiveSection = activeSection === index ? -1 : index
    this.setState({
      activeSection: nextActiveSection
    })

    // Saving the activeSection to local preference
    const userName = userSession.profile.login
    logger.debug(`-----> Saving new tag activeSection ${nextActiveSection}`)
    localPref.set(userName,
      Object.assign({}, localPref.get(userName), { activeSection: nextActiveSection }))
  }

  renderTagSection () {
    const { userSession } = this.props
    const { activeSection } = this.state

    let gitHubHost = 'github.com'
    if (conf.get('enterprise:enable')) {
      gitHubHost = conf.get('enterprise:host')
    }

    return (
      <div className='gist-tag-section'>
        <div className='tag-section-list'>
          <div
            className={
              activeSection === 1 ? 'tag-section tag-section-active'
                : activeSection === -1 ? 'tag-section'
                  : 'tag-section tag-section-hidden'}>
            <div className='pinned-tag-header'>
              <a href='#'
                onClick={this.handleSectionClick.bind(this, 1)}
                className='tag-section-title'>
                Pinned
              </a>
              <a className='configure-tag' onClick={ this.handleConfigurePinnedTagClicked.bind(this) }>
                <div dangerouslySetInnerHTML={{ __html: plusIcon }} />
              </a>
            </div>
            <div className='tag-section-content'>
              <Row>
                <h5 className='pinned-title'>Tags</h5>
                { this.renderPinnedTags() }
              </Row>
              <Row className='pinned-spacer' />
              <Row>
                <h5 className='pinned-title'>Files</h5>
                { this.renderPinnedFiles() }
              </Row>
            </div>
          </div>
          <div className={
            activeSection === 2 ? 'tag-section tag-section-active'
              : activeSection === -1 ? 'tag-section'
                : 'tag-section tag-section-hidden'}>
            <a href='#'
              onClick={this.handleSectionClick.bind(this, 2)}
              className='tag-section-title'>Tags</a>
            <div className='tag-section-content'>
              { this.renderCustomTags() }
            </div>
          </div>
          <div
            className={
              activeSection === 0 ? 'tag-section tag-section-active'
                : activeSection === -1 ? 'tag-section'
                  : 'tag-section tag-section-hidden'}>
            <a href='#'
              className='tag-section-title'
              onClick={this.handleSectionClick.bind(this, 0)}>
              Languages</a>
            <div className='tag-section-content'>
              { this.renderLangTags() }
            </div>
          </div>
        </div>
      </div>
    )
  }

  handleTagInPinnedTagsModalClicked (tag) {
    const { tmpPinnedTags } = this.state
    tmpPinnedTags.has(tag)
      ? tmpPinnedTags.delete(tag)
      : tmpPinnedTags.add(tag)
    this.setState({
      tmpPinnedTags: tmpPinnedTags
    })
  }

  handleFileInPinnedTagsModalClicked (file) {
    const { tmpPinnedTags } = this.state
    tmpPinnedTags.has(file)
      ? tmpPinnedTags.delete(file)
      : tmpPinnedTags.add(file)
    this.setState({
      tmpPinnedTags: tmpPinnedTags
    })
  }

  closePinnedTagsModal () {
    this.props.updatePinnedTagsModalStatus('OFF')
    this.setState({
      tmpPinnedTags: new Set()
    })
  }

  renderAllFilesForPin () {
    const { gists } = this.props
    const { tmpPinnedTags } = this.state

    const rows = []
    const i = 1
    const customFiles = []
    Object.keys(gists).map(function (keyName, keyIndex) {
      const gist = gists[keyName]
      customFiles.push(gist)
    })

    customFiles.forEach(gist => {
      const filename = gist.brief.files[Object.keys(gist.brief.files)[0]].filename
      rows.push(
        <tr key={ filename + '-file-' + i }>
          <td key={ filename } className="pinned-file-column">
            <a
              onClick={this.handleFileInPinnedTagsModalClicked.bind(this, filename) }
              className={ tmpPinnedTags.has(filename) ? 'gist-file-pinned' : 'gist-file-not-pinned' }>
              { filename.startsWith('lang@') ? Resolved(filename) : filename }
            </a>
          </td></tr>)
    })

    return (
      <table key='file-table' className='pin-file-table'>
        <tbody>
          { rows }
        </tbody>
      </table>
    )
  }

  renderAllTagsForPin () {
    const { gistTags } = this.props
    const { tmpPinnedTags } = this.state

    const langTags = []
    const customTags = []

    Object.keys(gistTags).sort().forEach(item => {
      item.startsWith('lang@')
        ? langTags.push(item)
        : customTags.push(item)
    })
    const orderedGistTags = [...customTags, ...langTags]

    const tagsForPinRows = []
    let i = 1
    let row = []
    orderedGistTags.forEach(tag => {
      row.push(
        <td key={ tag }>
          <a
            onClick={ this.handleTagInPinnedTagsModalClicked.bind(this, tag) }
            className={ tmpPinnedTags.has(tag) ? 'gist-tag-pinned' : 'gist-tag-not-pinned' }>
              #{ tag.startsWith('lang@') ? Resolved(tag) : tag }
          </a>
        </td>)
      if (i++ % 5 === 0) {
        tagsForPinRows.push(<tr key={ tag + '-tag-' + i }>{ row }</tr>)
        row = []
      }
    })

    row && tagsForPinRows.push(<tr key={ 'tag' + i }>{ row }</tr>)

    return (
      <table key='tag-table' className='pin-tag-table'>
        <tbody>
          { tagsForPinRows }
        </tbody>
      </table>
    )
  }

  handlePinnedTagSaved () {
    const { tmpPinnedTags } = this.state
    const { updatePinnedTags, userSession, localPref } = this.props

    const pinnedTags = Array.from(tmpPinnedTags)
    logger.info('[Dispatch] updatePinnedTags')
    updatePinnedTags(pinnedTags)
    this.closePinnedTagsModal()

    // Saving the pinnedTags to local preference
    const userName = userSession.profile.login
    localPref.set(userName, Object.assign({}, localPref.get(userName), { pinnedTags }))
  }

  renderPinnedTagsModal () {
    const { pinnedTagsModalStatus } = this.props

    return (
      <Modal
        className='pinned-tags-modal'
        show={ pinnedTagsModalStatus === 'ON' }
        onHide={ this.closePinnedTagsModal.bind(this) }>
        <Modal.Header closeButton>
          <Modal.Title>Pin tags or file</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row key='pinned-tags' className='pinned-tags-row'>
            <h4 className='pinned-title'>Tags</h4>
            { this.renderAllTagsForPin() }
          </Row>
          <Row key='pinned-files' className='pinned-files-row'>
            <h4 className='pinned-title'>Files</h4>
            { this.renderAllFilesForPin() }
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button bsStyle="default" onClick={ this.handlePinnedTagSaved.bind(this) }><AiOutlineSave /> Save</Button>
          <Button onClick={ this.closePinnedTagsModal.bind(this) }><ImCancelCircle />Cancel</Button>
        </Modal.Footer>
      </Modal>
    )
  }

  render () {
    const {
      searchIndex,
      updateLocalStorage,
      getLoggedInUserInfo,
      reSyncUserGists,
      launchAuthWindow
    } = this.props

    return (
      <div className='menu-panel'>
        <UserPanel
          className='user-panel'
          searchIndex = { searchIndex }
          updateLocalStorage = { updateLocalStorage }
          getLoggedInUserInfo = { getLoggedInUserInfo }
          reSyncUserGists = { reSyncUserGists }
          launchAuthWindow = { launchAuthWindow }
        />
        { this.renderTagSection() }
        { this.renderPinnedTagsModal() }
      </div>
    )
  }
}

function mapStateToProps (state) {
  return {
    gists: state.gists,
    gistTags: state.gistTags,
    pinnedTags: state.pinnedTags,
    userSession: state.userSession,
    activeGistTag: state.activeGistTag,
    pinnedTagsModalStatus: state.pinnedTagsModalStatus
  }
}

function mapDispatchToProps (dispatch) {
  return bindActionCreators({
    selectGistTag: selectGistTag,
    selectGist: selectGist,
    fetchSingleGist: fetchSingleGist,
    updatePinnedTags: updatePinnedTags,
    updatePinnedTagsModalStatus: updatePinnedTagsModalStatus
  }, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(NavigationPanel)
