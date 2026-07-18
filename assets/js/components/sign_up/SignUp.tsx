import React, { useEffect, useState } from "react";
import { Button, Form, Input } from "antd";
import { LockOutlined, UserOutlined, RobotOutlined, HomeOutlined } from "@ant-design/icons";
import signupText from "./signupText";

export interface SignUpProps {
  submitUser(
    newUsername: string,
    newPassword: string,
    newNickname: string
  ): any;
  errors: object;
}

export const SignUp: React.FC<SignUpProps> = (props: SignUpProps) => {
  const { submitUser, errors } = props;
  const [form] = Form.useForm();
  const nicknameRegex = new RegExp(/^\w[\w.]{2,18}\w$/);
	const [imageNumber, setImageNumber] = useState(1);

  const onFinish = (userData: any) => {
    submitUser(userData.email, userData.confirmPassword, userData.nickname);
  };

  useEffect(() => {
    if (errors) {
      form.setFields(
        Object.keys(errors).map((key) => ({
          name: key,
          errors: [errors[key]],
        }))
      );
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
          title={signupText.homeButtonTitle}
        />
      </a>
      <div className="max-w-md w-full mt-12 sm:mt-0">
        <div className="p-5 rounded-2xl bg-white shadow">
          <p className="text-center text-lg lg:text-xl sm:text-2xl font-bold mb-6">
            <span className="text-purple-600">{signupText.brand.pomo}</span><span className="text-black">{signupText.brand.room}</span>
          </p>
          <p className="text-gray-800 text-center text-2xl md:text-2xl lg:text-3xl font-bold">
            {signupText.welcome}
						<p className="text-gray-800 text-center text-sm md:text-lg lg:text-xl font-bold mt-2">
            	{signupText.subtitle}
						</p>
          </p>
          <Form
            form={form}
            layout="vertical"
            name="normal_signup"
            onFinish={onFinish}
            className="mt-5 space-y-4"
            scrollToFirstError
          >
            <Form.Item
              label={signupText.form.emailLabel}
							className="mb-2"
              name="email"
              rules={[
                { required: true, message: signupText.form.emailRequired },
                {
                  type: "email",
                  message: signupText.form.emailInvalid,
                },
              ]}
              hasFeedback
            >
              <Input
                prefix={<UserOutlined className="site-form-item-icon" />}
              />
            </Form.Item>

            <Form.Item
              label={signupText.form.passwordLabel}
              name="password"
              rules={[
                {
                  required: true,
                  message: signupText.form.passwordRequired,
                },
                {
                  type: "string",
                  min: 8,
                  max: 64,
                  message: signupText.form.passwordLength,
                },
              ]}
              hasFeedback
            >
              <Input.Password
                prefix={<LockOutlined className="site-form-item-icon" />}
              />
            </Form.Item>

            <Form.Item
              label={signupText.form.confirmPasswordLabel}
              name="confirmPassword"
              dependencies={["password"]}
              rules={[
                {
                  required: true,
                  message: signupText.form.confirmPasswordRequired,
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error(signupText.form.confirmPasswordMismatch)
                    );
                  },
                }),
              ]}
              hasFeedback
            >
              <Input.Password
                prefix={<LockOutlined className="site-form-item-icon" />}
              />
            </Form.Item>

            <Form.Item
              label={signupText.form.nicknameLabel}
              name="nickname"
              tooltip={signupText.form.nicknameTooltip}
              rules={[
                {
                  required: true,
                  message: signupText.form.nicknameRequired,
                  whitespace: true,
                },
                {
                  pattern: nicknameRegex,
                  message: signupText.form.nicknameInvalid,
                },
                {
                  min: 2,
                  max: 64,
                  message: signupText.form.nicknameLength,
                },
              ]}
              hasFeedback
            >
              <Input prefix={<RobotOutlined />} />
            </Form.Item>
						<Form.Item>
						<Button
              htmlType="submit"
              className="!h-11 !border-2 mt-2 text-white text-base font-semibold transitiona-all duration-700 bg-purple-500 !border-purple-500 hover:!bg-purple-400 hover:!border-purple-300 hover:!text-white focus:!bg-purple-400 focus:!border-purple-300 focus:!text-white active:!bg-purple-400 active:!border-purple-300 active:!text-white"
              block
            >
              {signupText.form.submit}
            </Button>
            <p className="text-gray-800 text-sm !mt-5 mb-0 text-center">
              {signupText.form.haveAccountPrefix}
              <a
                href="login"
                className="text-blue-600 underline ml-1 whitespace-nowrap font-semibold"
              >
                {signupText.form.loginLink}
              </a>
            </p>
						</Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
};
