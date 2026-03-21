import React, { useEffect, useState } from "react";
import { Button, Form, Input } from "antd";
import { LockOutlined, UserOutlined, RobotOutlined, HomeOutlined } from "@ant-design/icons";

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
      className="min-h-screen flex flex-col items-center justify-center p-8"
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
          className="absolute top-8 left-8 shadow bg-white" 
          icon={<HomeOutlined />} 
          size="large" 
          title="Página de inicio" 
        />
      </a>
      <div className="max-w-md w-full">
        <div className="p-5 rounded-2xl bg-white shadow">
          <p className="text-gray-800 text-center text-2xl font-bold">
            ¡Es fácil empezar!
						<p className="text-gray-800 text-center text-xl font-bold">
            	Crea tu cuenta y empieza a ser más productivo.
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
              label="Email"
							className="mb-2"
              name="email"
              rules={[
                { required: true, message: "¡Por favor ingrese su email!" },
                {
                  type: "email",
                  message: "¡La entrada no es un email válido!",
                },
              ]}
              hasFeedback
            >
              <Input
                prefix={<UserOutlined className="site-form-item-icon" />}
              />
            </Form.Item>

            <Form.Item
              label="Contraseña"
              name="password"
              rules={[
                {
                  required: true,
                  message: "¡Por favor ingrese su contraseña!",
                },
                {
                  type: "string",
                  min: 8,
                  max: 64,
                  message: "¡La contraseña debe tener entre 8 y 64 caracteres!",
                },
              ]}
              hasFeedback
            >
              <Input.Password
                prefix={<LockOutlined className="site-form-item-icon" />}
              />
            </Form.Item>

            <Form.Item
              label="Confirmar contraseña"
              name="confirmPassword"
              dependencies={["password"]}
              rules={[
                {
                  required: true,
                  message: "¡Por favor, confirme su contraseña!",
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error(
                        "¡La contraseña que ingresó no coincide con la anterior!"
                      )
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
              label="Apodo"
              name="nickname"
              tooltip="¿Cómo quieres que te llamen los demás?"
              rules={[
                {
                  required: true,
                  message: "¡Por favor ingresa tu apodo!",
                  whitespace: true,
                },
                {
                  pattern: nicknameRegex,
                  message: "¡La entrada no es un apodo válido!",
                },
                {
                  min: 2,
                  max: 64,
                  message: "El apodo debe tener entre 2 y 64 caracteres",
                },
              ]}
              hasFeedback
            >
              <Input prefix={<RobotOutlined />} />
            </Form.Item>
						<Form.Item>
						<Button
              htmlType="submit"
              className="mt-2 text-white text-sm font-semibold transitiona-all duration-700 bg-blue-500"
              block
            >
              Crear cuenta
            </Button>
            <p className="text-gray-800 text-sm !mt-5 mb-0 text-center">
              Ya
              <a
                href="login"
                className="text-blue-600 underline ml-1 whitespace-nowrap font-semibold"
              >
                tengo una cuenta
              </a>
            </p>
						</Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
};
