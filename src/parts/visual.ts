import { Func } from '../core/func';
import { Canvas } from '../webgl/canvas';
import { Update } from '../libs/update';
import vs from '../glsl/paper.vert';
import fs from '../glsl/paper.frag';
import { Object3D, Mesh, PlaneGeometry, Vector3, RawShaderMaterial, DoubleSide, UniformsUtils, UniformsLib, AmbientLight, PointLight, MeshBasicMaterial } from 'three';
import { Util } from '../libs/util';
import { Conf } from '../core/conf';
import { TexLoader } from '../webgl/texLoader';
import { Param } from '../core/param';
import { MousePointer } from '../core/mousePointer';

export class Visual extends Canvas {

  private _con:Object3D;

  // ライト
  private _ambLight:AmbientLight;
  private _ptLight:PointLight;

  private _bg: Mesh;
  private _paper: Mesh;

  constructor(opt: any) {
    super(opt);

    this._con = new Object3D();
    this.mainScene.add(this._con);

    // ライト
    this._ambLight = new AmbientLight(0xffffff, 0.1);
    this.mainScene.add(this._ambLight);
    this._ptLight = new PointLight(0xffffff, 1, 0);
    this.mainScene.add(this._ptLight);

    const uni = {
      tDiffuse:{value:null, type:'t'},
      angle:{value:0, type:'f'},
      progress:{value:0, type:'f'},
      diffuse:{value:new Vector3(1,1,1)},
      emissive:{value:new Vector3(0,0,0)},
      bgColor:{value:new Vector3(0,0,0)},
      radOffset:{value:1},
      rollsOffset:{value:1},
    }

    this._bg = new Mesh(
      new PlaneGeometry(1, 1),
      new MeshBasicMaterial({
        // transparent: true,
        map: TexLoader.instance.get(Conf.instance.PATH_IMG + 't-text.png'),
        depthTest: false,
        side: DoubleSide,
      })
    );
    this._con.add(this._bg);
    this._bg.renderOrder = 0;

    this._paper = new Mesh(
      new PlaneGeometry(1, 1, 64, 64),
      new RawShaderMaterial({
        vertexShader: vs,
        fragmentShader: fs,
        side: DoubleSide,
        // transparent: true,
        lights: true,
        depthTest: false,
        uniforms: UniformsUtils.merge([
          UniformsLib.lights,
          uni,
        ])
      })
    )
    this._con.add(this._paper);
    this._paper.renderOrder = 1;
    this._getUni(this._paper).tDiffuse.value = TexLoader.instance.get(Conf.instance.PATH_IMG + 't-text.png')


    this._resize();
  }


  protected _update(): void {
    super._update();

    const w = Func.instance.sw();
    const h = Func.instance.sh();

    const mx = MousePointer.instance.easeNormal.x;
    const my = MousePointer.instance.easeNormal.y;

    const paperParam = Param.instance.paper;
    const uni = this._getUni(this._paper);
    uni.angle.value = Util.radian(Util.map(paperParam.angle.value, 0, 180, 0, 100) + (my * -1) * 30);
    // uni.progress.value = Util.map(paperParam.progress.value, 1, 0, 0, 100);
    uni.progress.value = 1 - (Util.map(mx, 0.6, 0, -1, 1) + Math.cos(Util.radian(this._c * 1)) * 0.01);
    uni.radOffset.value = paperParam.radOffset.value * 0.01;
    uni.rollsOffset.value = paperParam.rollsOffset.value * 0.01;

    this._paper.rotation.x = Util.radian(my * 45);
    this._paper.rotation.y = Util.radian(mx * 45);
    this._bg.rotation.x = this._paper.rotation.x
    this._bg.rotation.y = this._paper.rotation.y

    this.cameraPers.position.z = Param.instance.camera.z.value * 0.01 * Func.instance.val(1.5, 1);

    const lightParam = Param.instance.light;
    this._ptLight.position.x = w * lightParam.x.value * 0.01
    this._ptLight.position.y = h * lightParam.y.value * 0.01
    this._ptLight.position.z = w * lightParam.z.value * 0.01
    this._ptLight.intensity = lightParam.intensity.value * 0.01

    if (this.isNowRenderFrame()) {
      this._render()
    }
  }


  private _render(): void {
    this.renderer.setClearColor(0xffffff, 1);
    this.renderer.render(this.mainScene, this.cameraPers);
  }


  public isNowRenderFrame(): boolean {
    return this.isRender && Update.instance.cnt % 1 == 0
  }


  _resize(): void {
    super._resize();

    const w = Func.instance.sw();
    const h = Func.instance.sh();

    this.renderSize.width = w;
    this.renderSize.height = h;

    this._updateOrthCamera(this.cameraOrth, w, h);

    this.cameraPers.fov = 45;
    this._updatePersCamera(this.cameraPers, w, h);

    let pixelRatio: number = window.devicePixelRatio || 1;
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(w, h);
    this.renderer.clear();
  }
}
