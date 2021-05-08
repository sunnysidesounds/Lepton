import HighlightJS from 'highlight.js'
import MarkdownIt from 'markdown-it'
import MdEmoji from 'markdown-it-emoji'
import MdTaskList from 'markdown-it-task-lists'
import MdKatex from 'markdown-it-katex'

// Configure markdown-it
const Md = MarkdownIt({
  linkify: true,
  html: true,
  highlight: (str, lang) => {
    if (lang && HighlightJS.getLanguage(lang)) {
      try {
        return HighlightJS.highlight(lang, str).value
      } catch (__) {}
    }
    return HighlightJS.highlightAuto(str).value
  }
})
  .use(MdTaskList)
  .use(MdEmoji)
  .use(MdKatex, { throwOnError: false, errorColor: ' #cc0000' })

export default Md
