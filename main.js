import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// --- 初始化场景、相机、渲染器 ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2a2a2a);

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(3, 2, 5);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 限制像素比提高性能
renderer.shadowMap.enabled = true; // 如果需要阴影
document.body.appendChild(renderer.domElement);

// --- 光照系统 ---
// 环境光提供基础照明
const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
scene.add(ambientLight);

// 主方向光模拟太阳
const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
mainLight.position.set(5, 10, 7);
mainLight.castShadow = true;
mainLight.shadow.mapSize.width = 1024;
mainLight.shadow.mapSize.height = 1024;
scene.add(mainLight);

// 补光从背面
const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
fillLight.position.set(-5, 2, -5);
scene.add(fillLight);

// --- 轨道控制器 ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 0, 0);
controls.update();

// --- 加载 GLB 模型 ---
const loader = new GLTFLoader();
const loadingDiv = document.getElementById('loading');

loader.load(
  'model.glb', // 模型文件路径
  (gltf) => {
    // 模型加载成功
    const model = gltf.scene;
    scene.add(model);

    // 自动计算模型的包围盒，调整相机和控制器
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    // 根据模型大小调整相机远近距离
    camera.near = maxDim / 100;
    camera.far = maxDim * 100;
    camera.updateProjectionMatrix();

    // 设置相机距离，使模型完整可见
    const distance = maxDim * 1.8;
    camera.position.set(
      center.x + distance * 0.8,
      center.y + distance * 0.6,
      center.z + distance
    );
    controls.target.copy(center);
    controls.update();

    // 隐藏加载提示
    loadingDiv.style.opacity = '0';
    setTimeout(() => loadingDiv.remove(), 500);
  },
  (xhr) => {
    // 加载进度
    const percent = xhr.total ? Math.round((xhr.loaded / xhr.total) * 100) : 0;
    loadingDiv.textContent = `模型加载中... ${percent}%`;
  },
  (error) => {
    // 加载失败
    console.error('模型加载失败:', error);
    loadingDiv.textContent = '模型加载失败，请检查文件是否存在';
  }
);

// --- 动画循环 ---
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// --- 响应窗口大小变化 ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
