const FnAdditional = require('../interfaces/FnAdditional')

const Option = require('../enums/CursorManager')
const Field = require('../enums/Cursor')

class Backspace extends FnAdditional {
    constructor () {
        super()
        this.name = 'backspace'
        this.type = 'backspace'
    }

    handler (step, undos, redos) {
        let length = undos.length

        /* 1 */
        if (length > 0) {
            let last = undos[length - 1]

            if (step.type === last.type && step.created - last.created < 1000) {
                last.content.effect_count += step.content.effect_count
                last.after = step.after

                last.updated = new Date().getTime()

                return
            }
        }

        undos.push(step)
    }

    /**
     * 1. 对于一次 Backspace，只处理那些有选区的光标，其他的不做删除操作
     * 2. 光标在大于第一行的行首处，删除该行，并将光标后的内容剪贴到上一行
     */
    do (event) {
        event.preventDefault()

        /* 1 */
        let handled = false

        this.cursor.do((cursor) => {
            if (cursor.isSelectionExist()) {
                cursor.storage[Field.SAVED] = cursor.getSelectionContent()
                cursor.removeSelectionContent()
                handled = true
            }
        }, Option.NOT_REMOVE_SELECTION, Option.NOT_DETECT_COLLISION)

        if (!handled) {
            this.cursor.do((cursor) => {
                if (cursor.logicalX > 0) {
                    let content = this.line.deleteContent(cursor.logicalY, cursor.logicalX - 1, cursor.logicalX)
                    cursor.logicalX -= 1
                    return content.substring(cursor.logicalX - 1, cursor.logicalX)
                }

                /* 2 */
                if (cursor.logicalY > 0) {
                    let content = cursor.contentAround()
                    this.line.delete(cursor.logicalY)
                    cursor.logicalY -= 1
                    cursor.xToEnd()
                    this.line.insertContent(cursor.logicalY, cursor.logicalX, content.after)
                    return ''
                }
            }, Option.NOT_REMOVE_SELECTION)
        }
    }

    undo (step) {
        let {before} = step

        cursor.deserialize(before)
    }

    redo (step) {

    }
}

module.exports = Backspace
