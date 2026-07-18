import React, { useEffect, useState } from "react";
import { Button, Form, Input, Statistic} from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { HomeOutlined } from '@ant-design/icons';
import loginText from "./loginText";

export interface LoginProps {
  searchUser(email: string, password: string): any;
  errors: object;
}

export const Login: React.FC<LoginProps> = (props: LoginProps) => {
  const { searchUser, errors } = props;
  const [form] = Form.useForm();
  const [imageNumber, setImageNumber] = useState(1);

  const onFinish = (newValues: any) => {
    searchUser(newValues.email, newValues.password);
  };

  useEffect(() => {
    if (errors) {
      const commonError = errors["email"] || errors["password"];
      if (commonError) {
        form.setFields([
          { name: "email", errors: [commonError] },
          { name: "password", errors: [commonError] },
        ]);
      }
    }
  }, [errors, form]);

  useEffect(() => {
    const randomImageNumber = Math.floor(Math.random() * 5) + 1;
    setImageNumber(randomImageNumber);
  }, []);

  return (
    <div
      className="relative min-h-dvh flex flex-col items-center justify-center overflow-y-auto p-4 sm:p-8"
      style={{
        backgroundImage: `url(/images/background2/background-${imageNumber}.svg)`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundColor: "rgba(255, 255, 255, 0.5)",
        backgroundBlendMode: "overlay",
      }}
    >
      <a href="/">
        <Button
          className="absolute top-4 left-4 sm:top-8 sm:left-8 shadow bg-white"
          icon={<HomeOutlined />}
          size="large"
          title={loginText.homeButtonTitle}
        />
      </a>
      <div className="max-w-md md:max-w-lg lg:max-w-xl w-full my-4">
        <div className="p-4 sm:p-8 rounded-2xl bg-white shadow">
          <p className="text-center text-lg lg:text-xl sm:text-2xl font-bold mb-6">
            <span className="text-purple-600">{loginText.brand.pomo}</span><span className="text-black">{loginText.brand.room}</span>
          </p>
          <p className="text-gray-800 text-center text-2xl md:text-2xl lg:text-3xl font-bold">
            {loginText.welcome}
          </p>
          <p className="text-gray-800 text-center text-sm md:text-lg lg:text-xl font-bold -mt-1">
            {loginText.subtitle}
          </p>
          <Form
              form={form}
              layout="vertical"
              name="normal_login"
              initialValues={{ remember: true }}
              onFinish={onFinish}
              className="mt-5 space-y-4"
            >
              <Form.Item
                label={loginText.form.emailLabel}
                name="email"
                rules={[
                  {
                    required: true,
                    message: loginText.form.emailRequired,
                  },
                ]}
              >
                <Input
                  prefix={<UserOutlined className="site-form-item-icon" />}
                  placeholder=""
                />
              </Form.Item>
              <Form.Item
                label={loginText.form.passwordLabel}
                name="password"
                rules={[
                  {
                    required: true,
                    message: loginText.form.passwordRequired,
                  },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="site-form-item-icon" />}
                />
              </Form.Item>
              <Form.Item>
                <a
                  className="text-blue-600 underline font-semibold"
                >
                  {loginText.form.forgotPassword}
                </a>
              </Form.Item>
              <Form.Item>
                <Button
                  htmlType="submit"
                  className="!h-11 !border-2 text-white text-base font-semibold transitiona-all duration-700 bg-purple-500 !border-purple-500 hover:!bg-purple-400 hover:!border-purple-300 hover:!text-white focus:!bg-purple-400 focus:!border-purple-300 focus:!text-white active:!bg-purple-400 active:!border-purple-300 active:!text-white"
                  block
                >
                  {loginText.form.submit}
                </Button>
                <p className="text-gray-800 text-sm !mt-5 mb-0 text-center">
                  {loginText.form.noAccount}
                  <a
                    href="signup"
                    className="text-blue-600 underline ml-1 whitespace-nowrap font-semibold"
                  >
                    {loginText.form.signupLink}
                  </a>
                </p>
              </Form.Item>
            </Form>
        </div>
      </div>
    </div>
  );
  
};
