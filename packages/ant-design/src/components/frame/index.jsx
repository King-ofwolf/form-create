import {toArray, uniqueId, isUndef} from '@form-create/utils';
import style from '../../style/index.css';
import {mount} from '../../core/modal';

const NAME = 'fc-antd-frame';

export default {
    name: NAME,
    props: {
        type: {
            type: String,
            default: 'input'
        },
        field: {
            type: String,
            default: ''
        },
        helper: {
            type: Boolean,
            default: true
        },
        disabled: {
            type: Boolean,
            default: false
        },
        src: {
            type: String,
            required: true
        },
        icon: {
            type: String,
            default: 'folder'
        },
        width: {
            type: [Number, String],
            default: 500
        },
        height: {
            type: [Number, String],
            default: 370
        },
        maxLength: {
            type: Number,
            default: 0
        },
        okBtnText: {
            type: String,
            default: '确定'
        },
        closeBtnText: {
            type: String,
            default: '关闭'
        },
        modalTitle: {
            type: String,
            default: '预览'
        },
        handleIcon: {
            type: [String, Boolean],
            default: undefined
        },
        title: String,
        allowRemove: {
            type: Boolean,
            default: true
        },
        onOpen: {
            type: Function,
            default: () => {
            }
        },
        onOk: {
            type: Function,
            default: () => {
            }
        },
        onCancel: {
            type: Function,
            default: () => {
            }
        },
        onLoad: {
            type: Function,
            default: () => {
            }
        },
        onBeforeRemove: {
            type: Function,
            default: () => {
            }
        },
        onRemove: {
            type: Function,
            default: () => {
            }
        },
        onHandle: {
            type: Function,
            default(src) {
                this.previewImage = src;
                this.previewVisible = true;
                //defaultOnHandle(src, this.modalTitle)
            }
        },
        modal: {
            type: Object,
            default: () => ({})
        },
        srcKey: {
            type: [String, Number]
        },
        value: [Array, String, Number]

    },
    data() {
        return {
            modalVm: null,
            fileList: toArray(this.value),
            unique: uniqueId(),
            previewVisible: false,
            previewImage: ''

        }
    },
    watch: {
        value(n) {
            this.fileList = toArray(n);
        },
        fileList(n) {
            const val = (this.maxLength === 1 ? (n[0] || '') : n);
            this.$emit('input', val);
            this.$emit('change', val);
        }
    },
    methods: {
        key(unique) {
            return NAME + unique + this.unique;
        },
        closeModel() {
            this.modalVm && this.modalVm.onClose();
            this.modalVm = null;
        },
        handleCancel() {
            this.previewVisible = false;
        },

        showModel() {
            if (this.disabled || false === this.onOpen()) return;

            const {width, height, src, title, okBtnText, closeBtnText} = this.$props;
            mount({width, title, ...this.modal}, (vNode, _vm) => {
                this.modalVm = _vm;
                return [vNode.make('iframe', {
                    attrs: {
                        src
                    },
                    style: {
                        'height': height,
                        'border': '0 none',
                        'width': '100%'
                    },
                    on: {
                        'load': (e) => {
                            this.onLoad(e);

                            try {
                                if (this.helper === true) {
                                    let iframe = e.path[0].contentWindow;

                                    iframe['form_create_helper'] = {
                                        close: (field) => {
                                            this.valid(field);
                                            _vm.onClose();
                                        },
                                        set: (field, value) => {
                                            this.valid(field);
                                            if (!this.disabled)
                                                this.$emit('input', value);

                                        },
                                        get: (field) => {
                                            this.valid(field);
                                            return this.value;
                                        }
                                    };

                                }
                            } catch (e) {
                                console.log(e);
                            }
                        }
                    },
                }), vNode.make('div', {slot: 'footer'}, [
                    vNode.button({
                        on: {
                            click: () => {
                                this.onCancel() !== false && _vm.onClose();
                            }
                        }
                    }, [closeBtnText]),
                    vNode.button({
                        props: {type: 'primary'}, on: {
                            click: () => {
                                this.onOk() !== false && _vm.onClose();
                            }
                        }
                    }, [okBtnText])
                ])]
            });
        },

        makeInput() {
            const props = {
                type: 'text',
                value: (this.fileList.map(v => this.getSrc(v))).toString(),
                readonly: true
            };

            return <AInput props={props} key={this.key('input')}>
                <AIcon type={this.icon} slot="addonAfter" on-click={this.showModel}/>
                {this.fileList.length ?
                    <AIcon type="close-circle" slot="suffix" on-click={() => this.fileList = []}/> : null}
            </AInput>
        },

        makeGroup(children) {
            if (!this.maxLength || this.fileList.length < this.maxLength)
                children.push(this.makeBtn());
            return <div class={style['fc-upload']} key={this.key('group')}>{...children}</div>
        },

        makeItem(index, children) {
            return <div class={style['fc-files']} key={this.key('file' + index)}>{...children}</div>;
        },
        valid(field) {
            if (field !== this.field)
                throw new Error('frame 无效的字段值');
        },

        makeIcons(val, index) {
            if (this.handleIcon !== false || this.allowRemove === true) {
                const icons = [];
                if ((this.type !== 'file' && this.handleIcon !== false) || (this.type === 'file' && this.handleIcon))
                    icons.push(this.makeHandleIcon(val, index));
                if (this.allowRemove)
                    icons.push(this.makeRemoveIcon(val, index));

                return <div class={style['fc-upload-cover']} key={this.key('uc')}>{icons}</div>
            }
        },
        makeHandleIcon(val, index) {
            return <AIcon
                type={(this.handleIcon === true || this.handleIcon === undefined) ? 'eye-o' : this.handleIcon}
                on-click={() => this.handleClick(val)} key={this.key('hi' + index)}/>
        },

        makeRemoveIcon(val, index) {
            return <AIcon type="delete" on-click={() => this.handleRemove(val)} key={this.key('ri' + index)}/>
        },

        makeFiles() {
            return this.makeGroup(this.fileList.map((src, index) => {
                return this.makeItem(index, [<AIcon type="file"
                    on-click={() => this.handleClick(src)}/>, this.makeIcons(src, index)])
            }))
        },
        makeImages() {
            return this.makeGroup(this.fileList.map((src, index) => {
                return this.makeItem(index, [<img src={this.getSrc(src)}/>, this.makeIcons(src, index)])
            }))
        },
        makeBtn() {
            return <div class={style['fc-upload-btn']} on-click={() => this.showModel()} key={this.key('btn')}>
                <AIcon type={this.icon} theme="filled"/>
            </div>
        },
        handleClick(src) {
            if (this.disabled) return;
            return this.onHandle(src);
        },
        handleRemove(src) {
            if (this.disabled) return;
            if (false !== this.onBeforeRemove(src)) {
                this.fileList.splice(this.fileList.indexOf(src), 1);
                this.onRemove(src);
            }
        },
        getSrc(src) {
            return isUndef(this.srcKey) ? src : src[this.srcKey];
        }
    },
    render() {
        const type = this.type;
        let Node;
        if (type === 'input')
            Node = this.makeInput();
        else if (type === 'image')
            Node = this.makeImages();
        else
            Node = this.makeFiles();

        return <div>{Node}
            <aModal visible={this.previewVisible} footer={null} on-cancel={this.handleCancel}>
                <img alt="example" style="width: 100%" src={this.previewImage}/>
            </aModal>
        </div>
    }
}