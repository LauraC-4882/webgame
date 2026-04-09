// Minimal site JS: handle simple form submissions (prevent real submission)
document.addEventListener('DOMContentLoaded',()=>{
  const forms = document.querySelectorAll('.auth-forms form');
  forms.forEach(f=>{
    f.addEventListener('submit',e=>{
      e.preventDefault();
      alert('表单已本地提交（示例）。实现后端以完成注册/登录流程。');
    });
  });
});
