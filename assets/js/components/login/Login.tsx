import React, { useEffect, useState } from "react";
import { Button, Form, Input, Statistic} from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { HomeOutlined } from '@ant-design/icons';

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
      <div className="max-w-md w-full mt-16">
        <div className="p-5 rounded-2xl bg-white shadow">
          <p className="text-gray-800 text-center text-2xl font-bold">
            ¡Nos alegra verte otra vez!
            <p className="text-gray-800 text-center text-xl font-bold">
              Ingresa tus datos para comenzar.
            </p>
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
                label="Email"
                name="email"
                rules={[
                  {
                    required: true,
                    message: "¡Por favor ingrese su correo electrónico!",
                  },
                ]}
              >
                <Input
                  prefix={<UserOutlined className="site-form-item-icon" />}
                  placeholder=""
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
                  Olvidaste tu contraseña?
                </a>
              </Form.Item>
              <Form.Item>
                <Button
                  htmlType="submit"
                  className="text-white text-sm font-semibold transitiona-all duration-700 bg-blue-500 "
                  block
                >
                  Iniciar sesión
                </Button>
                <p className="text-gray-800 text-sm !mt-5 mb-0 text-center">
                  ¿No tienes una cuenta?
                  <a
                    href="signup"
                    className="text-blue-600 underline ml-1 whitespace-nowrap font-semibold"
                  >
                    Registrate aquí
                  </a>
                </p>
              </Form.Item>
            </Form>
        </div>
      </div>
    </div>
  );
  
};
